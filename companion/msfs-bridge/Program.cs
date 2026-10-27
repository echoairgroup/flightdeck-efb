using System;
using System.Collections.Generic;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Microsoft.FlightSimulator.SimConnect;

namespace FlightDeckBridge
{
    internal sealed class BridgeSettings
    {
        public string BaseUrl { get; set; } = "";
        public string Token { get; set; } = "";
        public int DeviceId { get; set; }
    }

    internal enum DataDefinition { FlightData = 1 }
    internal enum DataRequest { FlightData = 1 }

    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    internal struct FlightData
    {
        public double Latitude;
        public double Longitude;
        public double AltitudeFt;
        public double IasKt;
        public double GroundSpeedKt;
        public double HeadingDeg;
        public double VerticalSpeedFpm;
        public double PitchDeg;
        public double BankDeg;
    }

    internal sealed class MainForm : Form
    {
        private const int WM_USER_SIMCONNECT = 0x0402;
        private readonly HttpClient _http = new HttpClient { Timeout = TimeSpan.FromSeconds(8) };
        private readonly JavaScriptSerializer _json = new JavaScriptSerializer();
        private readonly string _settingsPath = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "FlightDeckBridge", "settings.json");
        private BridgeSettings _settings;
        private SimConnect _simConnect;
        private TextBox _urlBox;
        private TextBox _pairBox;
        private Label _status;
        private Label _lastData;
        private Button _connectButton;
        private bool _connected;
        private int _uploadInProgress;
        private DateTime _lastUpload = DateTime.MinValue;

        public MainForm()
        {
            Text = "FlightDeck MSFS Companion";
            StartPosition = FormStartPosition.CenterScreen;
            MinimumSize = new Size(560, 410);
            Size = new Size(620, 470);
            BackColor = Color.FromArgb(19, 26, 20);
            ForeColor = Color.FromArgb(232, 239, 226);
            Font = new Font("Segoe UI", 9F);
            _settings = LoadSettings();
            BuildInterface();
            FormClosing += OnFormClosing;
            if (!String.IsNullOrWhiteSpace(_settings.Token))
                SetStatus("Companion is paired. Connect to MSFS 2024 when a flight is loaded.", false);
            else
                SetStatus("Not paired. Generate a code in FlightDeck website settings.", false);
        }

        private void BuildInterface()
        {
            var root = new TableLayoutPanel
            {
                Dock = DockStyle.Fill, Padding = new Padding(22), ColumnCount = 1,
                RowCount = 7, BackColor = BackColor
            };
            root.RowStyles.Add(new RowStyle(SizeType.Absolute, 48));
            root.RowStyles.Add(new RowStyle(SizeType.Absolute, 24));
            root.RowStyles.Add(new RowStyle(SizeType.Absolute, 64));
            root.RowStyles.Add(new RowStyle(SizeType.Absolute, 68));
            root.RowStyles.Add(new RowStyle(SizeType.Absolute, 48));
            root.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            root.RowStyles.Add(new RowStyle(SizeType.Absolute, 25));
            Controls.Add(root);

            var heading = new Label
            {
                Text = "FLIGHTDECK  /  MSFS COMPANION", Dock = DockStyle.Fill,
                Font = new Font("Segoe UI Semibold", 15F, FontStyle.Bold),
                ForeColor = Color.FromArgb(183, 217, 91), TextAlign = ContentAlignment.MiddleLeft
            };
            root.Controls.Add(heading, 0, 0);
            root.Controls.Add(new Label
            {
                Text = "Connect Microsoft Flight Simulator 2024 to your own FlightDeck account.",
                Dock = DockStyle.Fill, ForeColor = Color.FromArgb(159, 174, 152),
                TextAlign = ContentAlignment.MiddleLeft
            }, 0, 1);

            var urlGroup = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 2 };
            urlGroup.RowStyles.Add(new RowStyle(SizeType.Absolute, 23));
            urlGroup.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            urlGroup.Controls.Add(MakeLabel("FlightDeck website URL"), 0, 0);
            _urlBox = MakeInput(_settings.BaseUrl);
            urlGroup.Controls.Add(_urlBox, 0, 1);
            root.Controls.Add(urlGroup, 0, 2);

            var pairGroup = new TableLayoutPanel { Dock = DockStyle.Fill, ColumnCount = 1, RowCount = 2 };
            pairGroup.RowStyles.Add(new RowStyle(SizeType.Absolute, 23));
            pairGroup.RowStyles.Add(new RowStyle(SizeType.Percent, 100));
            pairGroup.Controls.Add(MakeLabel("One-time pairing code from website Settings"), 0, 0);
            _pairBox = MakeInput("");
            _pairBox.CharacterCasing = CharacterCasing.Upper;
            _pairBox.MaxLength = 8;
            pairGroup.Controls.Add(_pairBox, 0, 1);
            root.Controls.Add(pairGroup, 0, 3);

            _connectButton = new Button
            {
                Text = "Pair / connect to MSFS 2024", Dock = DockStyle.Left, Width = 240,
                Height = 38, FlatStyle = FlatStyle.Flat, BackColor = Color.FromArgb(183, 217, 91),
                ForeColor = Color.FromArgb(21, 29, 15), Font = new Font("Segoe UI Semibold", 9F, FontStyle.Bold)
            };
            _connectButton.FlatAppearance.BorderSize = 0;
            _connectButton.Click += async (s, e) => await PairAndConnectAsync();
            root.Controls.Add(_connectButton, 0, 4);

            var statusPanel = new Panel { Dock = DockStyle.Fill, Padding = new Padding(12), BackColor = Color.FromArgb(27, 36, 28) };
            _status = new Label { Dock = DockStyle.Top, Height = 42, ForeColor = Color.FromArgb(218, 229, 211), TextAlign = ContentAlignment.MiddleLeft };
            _lastData = new Label { Dock = DockStyle.Fill, ForeColor = Color.FromArgb(137, 155, 128), TextAlign = ContentAlignment.TopLeft };
            statusPanel.Controls.Add(_lastData);
            statusPanel.Controls.Add(_status);
            root.Controls.Add(statusPanel, 0, 5);
            root.Controls.Add(new Label
            {
                Text = "Telemetry is private to your account. Keep this Windows app and its pairing token private.",
                Dock = DockStyle.Fill, ForeColor = Color.FromArgb(111, 130, 104),
                Font = new Font("Segoe UI", 8F), TextAlign = ContentAlignment.MiddleLeft
            }, 0, 6);
        }

        private static Label MakeLabel(string text)
        {
            return new Label { Text = text, Dock = DockStyle.Fill, ForeColor = Color.FromArgb(137, 155, 128), TextAlign = ContentAlignment.MiddleLeft };
        }

        private static TextBox MakeInput(string value)
        {
            return new TextBox
            {
                Text = value, Dock = DockStyle.Fill, BorderStyle = BorderStyle.FixedSingle,
                BackColor = Color.FromArgb(11, 18, 12), ForeColor = Color.FromArgb(232, 239, 226),
                Font = new Font("Consolas", 10F), Margin = new Padding(0, 2, 0, 4)
            };
        }

        private BridgeSettings LoadSettings()
        {
            try
            {
                if (File.Exists(_settingsPath))
                {
                    var value = _json.Deserialize<BridgeSettings>(File.ReadAllText(_settingsPath));
                    if (value != null)
                    {
                        if (value.BaseUrl == null) value.BaseUrl = "";
                        return value;
                    }
                }
            }
            catch { }
            return new BridgeSettings();
        }

        private void SaveSettings()
        {
            try
            {
                var folder = Path.GetDirectoryName(_settingsPath);
                if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);
                File.WriteAllText(_settingsPath, _json.Serialize(_settings), Encoding.UTF8);
            }
            catch (Exception ex)
            {
                SetStatus("Settings could not be saved: " + ex.Message, true);
            }
        }

        private async Task PairAndConnectAsync()
        {
            _connectButton.Enabled = false;
            try
            {
                var baseUrl = _urlBox.Text.Trim().TrimEnd('/');
                if (!Uri.TryCreate(baseUrl, UriKind.Absolute, out Uri uri) ||
                    (uri.Scheme != Uri.UriSchemeHttps && uri.Host != "localhost" && uri.Host != "127.0.0.1"))
                    throw new InvalidOperationException("Use a valid HTTPS FlightDeck URL (HTTP is allowed only for localhost).");

                _settings.BaseUrl = baseUrl;
                if (String.IsNullOrWhiteSpace(_settings.Token))
                {
                    var code = _pairBox.Text.Trim().ToUpperInvariant();
                    if (code.Length != 8) throw new InvalidOperationException("Generate an eight-character pairing code in FlightDeck Settings first.");
                    SetStatus("Exchanging the one-time code for a private companion token…", false);
                    var body = _json.Serialize(new Dictionary<string, object>
                    {
                        { "code", code }, { "name", "FlightDeck MSFS 2024 Companion" }
                    });
                    using (var content = new StringContent(body, Encoding.UTF8, "application/json"))
                    using (var response = await _http.PostAsync(baseUrl + "/api/bridge/connect", content))
                    {
                        var text = await response.Content.ReadAsStringAsync();
                        var data = _json.Deserialize<Dictionary<string, object>>(text) ?? new Dictionary<string, object>();
                        if (!response.IsSuccessStatusCode)
                            throw new InvalidOperationException(data.ContainsKey("error") ? Convert.ToString(data["error"]) : "Pairing failed with HTTP " + (int)response.StatusCode + ".");
                        if (!data.ContainsKey("token")) throw new InvalidOperationException("The server did not return a companion token.");
                        _settings.Token = Convert.ToString(data["token"]);
                        if (data.ContainsKey("deviceId")) _settings.DeviceId = Convert.ToInt32(data["deviceId"]);
                        SaveSettings();
                        _pairBox.Clear();
                    }
                }

                SaveSettings();
                StartSimConnect();
            }
            catch (Exception ex) { SetStatus(ex.Message, true); }
            finally { if (!IsDisposed) _connectButton.Enabled = true; }
        }

        private void StartSimConnect()
        {
            if (_simConnect != null)
            {
                SetStatus("The simulator connection has already been started. Close the companion to reconnect.", false);
                return;
            }
            try
            {
                _simConnect = new SimConnect("FlightDeck EFB", Handle, WM_USER_SIMCONNECT, null, 0);
                _simConnect.OnRecvOpen += Simconnect_OnRecvOpen;
                _simConnect.OnRecvSimobjectData += Simconnect_OnRecvSimobjectData;
                AddDefinition("PLANE LATITUDE", "degrees");
                AddDefinition("PLANE LONGITUDE", "degrees");
                AddDefinition("PLANE ALTITUDE", "feet");
                AddDefinition("AIRSPEED INDICATED", "knots");
                AddDefinition("GROUND VELOCITY", "knots");
                AddDefinition("PLANE HEADING DEGREES TRUE", "degrees");
                AddDefinition("VERTICAL SPEED", "feet per minute");
                AddDefinition("PLANE PITCH DEGREES", "degrees");
                AddDefinition("PLANE BANK DEGREES", "degrees");
                _simConnect.RegisterDataDefineStruct<FlightData>(DataDefinition.FlightData);
                SetStatus("SimConnect is opening. Start or load a flight in MSFS 2024 if needed.", false);
                _lastData.Text = "Waiting for the first simulator data packet…";
            }
            catch (Exception ex)
            {
                if (_simConnect != null) { try { _simConnect.Dispose(); } catch { } _simConnect = null; }
                SetStatus("Could not open SimConnect. Confirm the MSFS 2024 SDK managed library is installed and the simulator is running. " + ex.Message, true);
            }
        }

        private void AddDefinition(string name, string unit)
        {
            _simConnect.AddToDataDefinition(DataDefinition.FlightData, name, unit, SIMCONNECT_DATATYPE.FLOAT64, 0.0f, SimConnect.SIMCONNECT_UNUSED);
        }

        private void Simconnect_OnRecvOpen(SimConnect sender, SIMCONNECT_RECV_OPEN data)
        {
            try
            {
                _simConnect.RequestDataOnSimObject(
                    DataRequest.FlightData,
                    DataDefinition.FlightData,
                    SimConnect.SIMCONNECT_OBJECT_ID_USER,
                    SIMCONNECT_PERIOD.SECOND,
                    SIMCONNECT_DATA_REQUEST_FLAG.DEFAULT,
                    0, 2, 0);
                _connected = true;
                SetStatus("Connected to Microsoft Flight Simulator. Waiting for telemetry…", false);
            }
            catch (Exception ex) { SetStatus("SimConnect opened but telemetry subscription failed: " + ex.Message, true); }
        }

        private void Simconnect_OnRecvSimobjectData(SimConnect sender, SIMCONNECT_RECV_SIMOBJECT_DATA data)
        {
            if ((DataRequest)data.dwRequestID != DataRequest.FlightData || data.dwData == null || data.dwData.Length == 0) return;
            try
            {
                var flight = (FlightData)data.dwData[0];
                _lastData.Text = String.Format(
                    CultureInfo.InvariantCulture,
                    "Position: {0:F4}, {1:F4}\r\nAltitude: {2:N0} ft     IAS: {3:N0} kt     Ground speed: {4:N0} kt\r\nHeading: {5:F0}°     Vertical speed: {6:N0} ft/min",
                    flight.Latitude, flight.Longitude, flight.AltitudeFt, flight.IasKt,
                    flight.GroundSpeedKt, flight.HeadingDeg, flight.VerticalSpeedFpm);
                if ((DateTime.UtcNow - _lastUpload).TotalSeconds < 1.8) return;
                _lastUpload = DateTime.UtcNow;
                if (Interlocked.Exchange(ref _uploadInProgress, 1) == 0)
                    _ = SendTelemetryAsync(flight);
            }
            catch (Exception ex) { SetStatus("Could not decode a simulator data packet: " + ex.Message, true); }
        }

        private async Task SendTelemetryAsync(FlightData flight)
        {
            try
            {
                var payload = new Dictionary<string, object>
                {
                    { "latitude", flight.Latitude },
                    { "longitude", flight.Longitude },
                    { "altitudeFt", flight.AltitudeFt },
                    { "iasKt", flight.IasKt },
                    { "groundSpeedKt", flight.GroundSpeedKt },
                    { "headingDeg", flight.HeadingDeg },
                    { "verticalSpeedFpm", flight.VerticalSpeedFpm },
                    { "pitchDeg", flight.PitchDeg },
                    { "bankDeg", flight.BankDeg },
                    { "simTime", DateTime.UtcNow.ToString("o", CultureInfo.InvariantCulture) }
                };
                using (var request = new HttpRequestMessage(HttpMethod.Post, _settings.BaseUrl.TrimEnd('/') + "/api/bridge/telemetry"))
                {
                    request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _settings.Token);
                    request.Content = new StringContent(_json.Serialize(payload), Encoding.UTF8, "application/json");
                    using (var response = await _http.SendAsync(request))
                    {
                        if (!response.IsSuccessStatusCode)
                        {
                            var text = await response.Content.ReadAsStringAsync();
                            var message = "Telemetry upload failed with HTTP " + (int)response.StatusCode + ".";
                            try
                            {
                                var data = _json.Deserialize<Dictionary<string, object>>(text);
                                if (data != null && data.ContainsKey("error")) message = Convert.ToString(data["error"]);
                            }
                            catch { }
                            BeginInvoke((Action)(() => SetStatus(message, true)));
                        }
                        else
                        {
                            BeginInvoke((Action)(() => SetStatus("Live telemetry is being sent to your private FlightDeck account.", false)));
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                if (!IsDisposed) BeginInvoke((Action)(() => SetStatus("Telemetry upload failed: " + ex.Message, true)));
            }
            finally { Interlocked.Exchange(ref _uploadInProgress, 0); }
        }

        protected override void WndProc(ref Message message)
        {
            if (message.Msg == WM_USER_SIMCONNECT && _simConnect != null)
            {
                try { _simConnect.ReceiveMessage(); }
                catch (Exception ex) { SetStatus("Lost the SimConnect data stream: " + ex.Message, true); }
            }
            base.WndProc(ref message);
        }

        private void SetStatus(string value, bool error)
        {
            if (IsDisposed || _status == null) return;
            if (InvokeRequired) { BeginInvoke((Action)(() => SetStatus(value, error))); return; }
            _status.Text = value;
            _status.ForeColor = error ? Color.FromArgb(239, 143, 130) : Color.FromArgb(218, 229, 211);
        }

        private void OnFormClosing(object sender, FormClosingEventArgs e)
        {
            try { if (_simConnect != null) _simConnect.Dispose(); } catch { }
            _http.Dispose();
        }
    }

    internal static class Program
    {
        [STAThread]
        private static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }
}
