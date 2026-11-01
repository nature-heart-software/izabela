# install_vs_build_tools.ps1

# Install Visual Studio Build Tools 2022
Invoke-WebRequest -Uri "https://aka.ms/vs/17/release/vs_buildtools.exe" -OutFile vs_buildtools.exe
Start-Process -Wait -FilePath vs_buildtools.exe -ArgumentList "--quiet --add Microsoft.VisualStudio.Workload.NativeDesktop --add Microsoft.VisualStudio.Component.VC.Tools.x86.x64 --add Microsoft.VisualStudio.Component.Windows10SDK --includeRecommended --includeOptional --nocache"
Remove-Item vs_buildtools.exe -Force

# List of tools: https://learn.microsoft.com/en-us/visualstudio/install/workload-component-id-vs-build-tools?view=vs-2022&preserve-view=true#desktop-development-with-c
