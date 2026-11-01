# install_yarn.ps1

# Install Yarn
Invoke-WebRequest -Uri "https://yarnpkg.com/latest.msi" -OutFile yarn.msi
Start-Process -Wait -FilePath msiexec.exe -ArgumentList "/i", "yarn.msi", "/quiet"
Remove-Item yarn.msi -Force
