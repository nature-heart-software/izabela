# install_vs_build_tools.ps1

$vsBuildToolsUri = "https://aka.ms/vs/16/release/vs_buildtools.exe"
Invoke-WebRequest -Uri $vsBuildToolsUri -OutFile vs_buildtools.exe
Start-Process -Wait -FilePath .\vs_buildtools.exe -ArgumentList "--quiet", "--wait", "--norestart", "--nocache", "--installPath=C:\BuildTools", "--add", "Microsoft.VisualStudio.Workload.VCTools", "--add", "Microsoft.VisualStudio.Workload.NodeBuildTools", "--add", "Microsoft.VisualStudio.Component.VC.14.29.C++.x86.x64"
Remove-Item vs_buildtools.exe -Force
