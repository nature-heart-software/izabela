FROM mcr.microsoft.com/windows/servercore:ltsc2019

WORKDIR /app

RUN icacls "C:\app" /grant:r everyone:(OI)(CI)F /t

COPY ./scripts/install-nodejs.ps1 ./scripts/install-nodejs.ps1
RUN powershell -Command ./scripts/install-nodejs.ps1

COPY ./scripts/install-yarn.ps1 ./scripts/install-yarn.ps1
RUN powershell -Command ./scripts/install-yarn.ps1

COPY ./scripts/install-python.ps1 ./scripts/install-python.ps1
RUN powershell -Command ./scripts/install-python.ps1

COPY ./scripts/install-vs-build-tools.ps1 ./scripts/install-vs-build-tools.ps1
RUN powershell -Command ./scripts/install-vs-build-tools.ps1

ENV PATH="C:\nodejs;C:\Program Files (x86)\Yarn\bin;C:\Python310;C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Tools\MSVC\14.30.30705\bin\Hostx64\x64;${PATH}"

ENV PYTHON="C:\Python310\python.exe"

ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm config set python C:\Python310\python.exe

RUN npm config set msvs_version 2022

COPY ./ ./

COPY ./lerna.json.prod ./lerna.json

RUN yarn install

RUN yarn build:deps

RUN yarn build:app
