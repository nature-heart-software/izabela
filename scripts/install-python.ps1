# install_python.ps1

# Install Python 3.10
Invoke-WebRequest -Uri "https://www.python.org/ftp/python/3.10.0/python-3.10.0-amd64.exe" -OutFile python-installer.exe
Start-Process -Wait -FilePath python-installer.exe -ArgumentList "/quiet", "InstallAllUsers=1", "TargetDir=C:\Python310"
Remove-Item python-installer.exe -Force
[System.Environment]::SetEnvironmentVariable('PATH', $env:PATH + ';C:\Python310;C:\Python310\Scripts', [System.EnvironmentVariableTarget]::Machine)
