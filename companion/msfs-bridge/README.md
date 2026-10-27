# FlyTech MSFS 2024 Companion (Windows)

This is the local Windows process that connects MSFS 2024 to your FlyTech cloud flight workspace. It is separate from the website because browsers cannot directly read another process on the simulator PC.

## Requirements

- Windows and Microsoft Flight Simulator 2024 installed
- The Microsoft Flight Simulator 2024 SDK installed from the simulator's Developer Mode
- Visual Studio with the .NET desktop development workload and the .NET Framework 4.8 targeting pack
- A deployed HTTPS FlightDeck instance with DATABASE_URL configured
- A FlyTech account with access to Settings

## Build

1. Install/open the MSFS 2024 SDK from Developer Mode.
2. Find the SDK directory that contains the SimConnect SDK folder.
3. Open this project in Visual Studio.
4. Set the MSFS_SDK_PATH MSBuild property to that SDK directory. For example, if the SDK lives in C:\MSFS SDK, the property value is C:\MSFS SDK. The managed reference must resolve to SimConnect SDK\lib\managed\Microsoft.FlightSimulator.SimConnect.dll. If your SDK release uses a different managed DLL filename, select the assembly named Microsoft.FlightSimulator.SimConnect from the installed SDK reference folder.
5. Build the Release configuration for x64.
6. Run FlightDeck.MSFS.Companion.exe on the same Windows PC that runs MSFS 2024.

No SDK DLLs are copied into this repository; use the assembly that comes with your own installed SDK.

## Pairing

1. Log in to the deployed FlyTech website.
2. Open Settings and the Microsoft Flight Simulator 2024 panel.
3. Generate a one-time pairing code. It expires after five minutes and can be used only once.
4. In the Windows companion, enter the HTTPS website URL and the eight-character code, then click Pair / connect.
5. Load into an MSFS 2024 flight. The companion should show position, altitude, indicated airspeed, groundspeed, heading and vertical speed.
6. Return to FlightDeck on the website or phone. When telemetry reaches the server, the simulator status should change to connected.

The companion stores its bearer token under the current Windows user's AppData folder. The server stores only a hash of that token. Keep the settings file private. If the token is lost or suspected to be exposed, revoke that device in the server database before pairing a new one.

## Troubleshooting

- A cloud pairing requires DATABASE_URL to be set and the website to be signed in.
- If SimConnect fails to open, ensure MSFS 2024 is running and the managed SDK assembly reference resolves. Build/run with the same Windows user as the simulator.
- If pairing succeeds but telemetry uploads fail, check that the configured website URL is the canonical HTTPS deployment and that its /api/health endpoint reports database: true.
- The companion should be treated as an early integration. It has not been compiled against your local SDK in this environment because the simulator SDK and Windows runtime are not available here.
