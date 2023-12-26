# install_nodejs.ps1

# Install Node.js
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -OutFile nodejs.zip -UseBasicParsing "https://nodejs.org/dist/v16.20.2/node-v16.20.2-win-x64.zip"
Expand-Archive nodejs.zip -DestinationPath C:\
Rename-Item "C:/node-v16.20.2-win-x64" C:\nodejs
Remove-Item nodejs.zip -Force
[System.Environment]::SetEnvironmentVariable('PATH', $env:PATH + ';C:\nodejs\;C:\nodejs\node_modules\npm\bin', [System.EnvironmentVariableTarget]::Machine)
