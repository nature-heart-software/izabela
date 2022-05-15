var $1hSWc$express = require("express");
var $1hSWc$bodyparser = require("body-parser");
var $1hSWc$cors = require("cors");
var $1hSWc$morgan = require("morgan");
var $1hSWc$path = require("path");
var $1hSWc$lodash = require("lodash");
var $1hSWc$axios = require("axios");
var $1hSWc$uuid = require("uuid");
var $1hSWc$util = require("util");
var $1hSWc$fs = require("fs");
var $1hSWc$microsoftcognitiveservicesspeechsdk = require("microsoft-cognitiveservices-speech-sdk");

function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}






const $9ea4c5e7d90b028e$export$d3da1ecaf1206c58 = (res, reason, message, code)=>{
    console.log('ERROR: ' + reason, message);
    if (process.env.NODE_ENV === 'production' && code === 500) return res.status(500).json({
        error: reason
    });
    return res.status(code || 500).json({
        error: message
    });
};








const $54aaeaab856c6181$export$2272521fb3bd5353 = async ({ body: { credentials: { apiKey: apiKey  } ,  } ,  }, res)=>{
    try {
        const { data: { voices: voices  } ,  } = await ($parcel$interopDefault($1hSWc$axios)).get(`https://texttospeech.googleapis.com/v1beta1/voices?key=${apiKey}`);
        res.status(200).json(voices);
    } catch (e) {
        $9ea4c5e7d90b028e$export$d3da1ecaf1206c58(res, 'Internal server error', e.message, 500);
    }
};
const $54aaeaab856c6181$export$720e715da265c262 = async ({ body: { credentials: { apiKey: apiKey  } , payload: payload ,  } ,  }, res)=>{
    const outputFile = $1hSWc$path.join($a3bdc0234368055c$export$2e2bcd8739ae039.getConfig().tempPath, $1hSWc$uuid.v4() + '.mp3');
    try {
        $1hSWc$fs.mkdirSync($1hSWc$path.parse(outputFile).dir, {
            recursive: true
        }, (err)=>{
            if (err) throw err;
        });
        $1hSWc$fs.writeFileSync(outputFile, '');
        const { data: { audioContent: audioContent  } ,  } = await ($parcel$interopDefault($1hSWc$axios)).post(`https://texttospeech.googleapis.com/v1beta1/text:synthesize?key=${apiKey}`, payload);
        const writeFile = $1hSWc$util.promisify($1hSWc$fs.writeFile);
        await writeFile(outputFile, Buffer.from(audioContent, 'base64'), 'binary');
        const stat = $1hSWc$fs.statSync(outputFile);
        const total = stat.size;
        res.writeHead(200, {
            'Content-Length': total,
            'Content-Type': 'audio/mp3'
        });
        const stream = $1hSWc$fs.createReadStream(outputFile).pipe(res);
        stream.on('finish', ()=>{
            $1hSWc$fs.unlinkSync(outputFile);
        });
    } catch (e) {
        if ($1hSWc$fs.existsSync(outputFile)) $1hSWc$fs.unlinkSync(outputFile);
        $9ea4c5e7d90b028e$export$d3da1ecaf1206c58(res, 'Internal server error', e.message, 500);
    }
};


const $5e8fcb11fef7f285$export$776ed06f580210d5 = ({ app: app  })=>{
    app.post('/api/tts/google-cloud/list-voices', $54aaeaab856c6181$export$2272521fb3bd5353);
    app.post('/api/tts/google-cloud/synthesize-speech', $54aaeaab856c6181$export$720e715da265c262);
};










const $151961d6168f89a5$export$2272521fb3bd5353 = async ({ body: { credentials: { apiKey: apiKey , region: region  } ,  } ,  }, res)=>{
    try {
        const endpoint = `https://${region}.tts.speech.${region.startsWith('china') ? 'azure.cn' : 'microsoft.com'}/cognitiveservices/voices/list`;
        const { data: voices  } = await ($parcel$interopDefault($1hSWc$axios)).get(endpoint, {
            headers: {
                'Ocp-Apim-Subscription-Key': apiKey
            }
        });
        res.status(200).json(voices);
    } catch (e) {
        $9ea4c5e7d90b028e$export$d3da1ecaf1206c58(res, 'Internal server error', e.message, 500);
    }
};
const $151961d6168f89a5$export$720e715da265c262 = async ({ body: { credentials: { apiKey: apiKey , region: region  } , payload: { text: text , voice: voice  } ,  } ,  }, res)=>{
    const outputFile = $1hSWc$path.join($a3bdc0234368055c$export$2e2bcd8739ae039.getConfig().tempPath, $1hSWc$uuid.v4() + '.mp3');
    try {
        $1hSWc$fs.mkdirSync($1hSWc$path.parse(outputFile).dir, {
            recursive: true
        }, (err)=>{
            if (err) throw err;
        });
        $1hSWc$fs.writeFileSync(outputFile, '');
        const speechConfig = $1hSWc$microsoftcognitiveservicesspeechsdk.SpeechConfig.fromSubscription(apiKey, region);
        speechConfig.speechSynthesisLanguage = voice.Locale;
        speechConfig.speechSynthesisVoiceName = voice.ShortName;
        speechConfig.speechSynthesisOutputFormat = $1hSWc$microsoftcognitiveservicesspeechsdk.SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3;
        const audioConfig = $1hSWc$microsoftcognitiveservicesspeechsdk.AudioConfig.fromAudioFileOutput(outputFile);
        const synthesizer = new $1hSWc$microsoftcognitiveservicesspeechsdk.SpeechSynthesizer(speechConfig, audioConfig);
        const audioContent = await new Promise((resolve, reject)=>{
            synthesizer.speakTextAsync(text, (result)=>{
                resolve(result.audioData);
                synthesizer.close();
            }, (error)=>{
                reject(error);
                synthesizer.close();
            });
        });
        const writeFile = $1hSWc$util.promisify($1hSWc$fs.writeFile);
        await writeFile(outputFile, Buffer.from(audioContent), 'binary');
        const stat = $1hSWc$fs.statSync(outputFile);
        const total = stat.size;
        res.writeHead(200, {
            'Content-Length': total,
            'Content-Type': 'audio/mp3'
        });
        const stream = $1hSWc$fs.createReadStream(outputFile).pipe(res);
        stream.on('finish', ()=>{
            $1hSWc$fs.unlinkSync(outputFile);
        });
    } catch (e) {
        if ($1hSWc$fs.existsSync(outputFile)) $1hSWc$fs.unlinkSync(outputFile);
        $9ea4c5e7d90b028e$export$d3da1ecaf1206c58(res, 'Internal server error', e.message, 500);
    }
};


const $2e5d6a656809d93c$export$a93cd00e7c1effd6 = ({ app: app  })=>{
    app.post('/api/tts/microsoft-azure/list-voices', $151961d6168f89a5$export$2272521fb3bd5353);
    app.post('/api/tts/microsoft-azure/synthesize-speech', $151961d6168f89a5$export$720e715da265c262);
};


const $a3bdc0234368055c$var$app = ($parcel$interopDefault($1hSWc$express))();
$a3bdc0234368055c$var$app.use(($parcel$interopDefault($1hSWc$cors))());
$a3bdc0234368055c$var$app.use(($parcel$interopDefault($1hSWc$bodyparser)).json());
$a3bdc0234368055c$var$app.use(($parcel$interopDefault($1hSWc$bodyparser)).urlencoded({
    extended: true
}));
if (process.env.NODE_ENV === 'development') $a3bdc0234368055c$var$app.use(($parcel$interopDefault($1hSWc$morgan))('dev'));
class $a3bdc0234368055c$var$IzabelaServer {
    server = null;
    config = null;
    defaultConfig = {
        tempPath: ($parcel$interopDefault($1hSWc$path)).resolve('temp'),
        port: 7070
    };
    async startApp() {
        this.server = $a3bdc0234368055c$var$app.listen(this.getConfig().port, ()=>{
            const port = this.server.address().port;
            console.log('App server now running on port', port);
        });
    }
    async startRouter() {
        const context = {
            app: $a3bdc0234368055c$var$app,
            server: this.server
        };
        $5e8fcb11fef7f285$export$776ed06f580210d5(context);
        $2e5d6a656809d93c$export$a93cd00e7c1effd6(context);
    }
    async startServer(config = {}) {
        this.config = $1hSWc$lodash.defaultsDeep(config, this.defaultConfig);
        await this.startRouter();
        await this.startApp();
    }
    getConfig() {
        return this.config || this.defaultConfig;
    }
}
const $a3bdc0234368055c$var$izabelaServer = new $a3bdc0234368055c$var$IzabelaServer();
var $a3bdc0234368055c$export$2e2bcd8739ae039 = $a3bdc0234368055c$var$izabelaServer;


const $af5f2ecd477d2761$var$args = process.argv.slice(2);
if ($af5f2ecd477d2761$var$args.includes('--start-server')) $a3bdc0234368055c$export$2e2bcd8739ae039.startServer();
module.exports = $a3bdc0234368055c$export$2e2bcd8739ae039;


//# sourceMappingURL=main.js.map
