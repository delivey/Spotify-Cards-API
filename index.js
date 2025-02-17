const path = require("path")
const express = require('express')
const SpotifyWebApi = require('spotify-web-api-node')
const cors = require('cors');

const app = express()
const port = process.env.PORT || 3000

// CORS
app.use(cors({
    origin: '*'
}));

// Static Dirs
app.use('/css', express.static('public/css'));
app.use('/fonts', express.static('fonts'));
app.use('/img', express.static('public/img'));

// Loading Dotenv if running on VPS
require('dotenv').config()

// Setting ClientID and ClientSecret
let spotifyApi = new SpotifyWebApi({
    clientId: process.env.Client_ID,
    clientSecret: process.env.Client_Secret,
    redirectUri: 'http://localhost:8888/callback',
});

// Defining Vars
let songName, songArtist, songImageURL; // Not Used

// Fonts for Card (Will switch back to Spotify Version of Gotham on production server)
const { registerFont, createCanvas, loadImage } = require('canvas');
registerFont("./fonts/GothamBold.ttf", { family: "GothamBold" });
registerFont("./fonts/Gotham-Black.otf", { family: "GothamBlack" });
registerFont("./fonts/GothamBook.ttf", { family: "GothamBook" });
registerFont("./fonts/GothamMedium.ttf", { family: "GothamMedium" });

// Client Credentials Flow with Auto Token Renew after 1 hour
function newToken(){
    spotifyApi.clientCredentialsGrant().then(
        function(data) {
        console.log('The access token expires in ' + data.body['expires_in']);
        // console.log('The access token is ' + data.body['access_token']);
    
        // Save the access token so that it's used in future calls
        spotifyApi.setAccessToken(data.body['access_token']);
        return data.body['access_token']
        },
        function(err) {
        console.log('Something went wrong when retrieving an access token', err);
        }
    );
}
newToken();
tokenRefreshInterval = setInterval(newToken, 1000 * 60 * 60);


let rgb2hex=c=>'#'+c.match(/\d+/g).map(x=>(+x).toString(16).padStart(2,0)).join``
async function getAverageColor(img) {
    return new Promise(resolve => {
        const tempCanvas = createCanvas(1080, 1080);
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.drawImage(img, 0, 0, 1, 1);
        const rgb = tempCtx.getImageData(0, 0, 1, 1).data.slice(0,3).join(", ")
        const hex = rgb2hex(rgb)
        resolve(hex);
    });
}

// Function, Name, Color
async function searchTracksbyName(name, color, res) {
    let totalArtist;
    let artistList = [];
    let artistString = '';
    let songName;
    let imageURL;
    const width = 1200
    const height = 630
    const imageX = 105;
    const imageY = 115;
    const imageWidth = 400
    const imageHeight = 400
    const songX = 560
    const songY = 200
    const songNameX = 560
    const songNameY = 250 // 260
    const songArtistX = 560
    const songArtistY = 380
    const bottomTextX = 805
    const bottomTextY = 542
    const text = 'SONG'
    const bottomText = 'LISTEN ON'

    const data = await spotifyApi.searchTracks(name, {market:'US', limit:1, offset:0})
    if (data.body.tracks.total === 0 || data.body.tracks.items.length === 0) {
        res.send("Invalid name")
        return false;
    }

    // Track Name
    songName = data.body.tracks.items[0].name;

    // Image URL 640x640
    imageURL = data.body.tracks.items[0].album.images[0].url

    // Artist List
    totalArtist = data.body.tracks.items[0].artists.length;
    for (let i = 0; i < totalArtist; i++) {
        artistList[i] = data.body.tracks.items[0].artists[i].name;
    }

    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    if (color === "#000") {
        const image = await loadImage(imageURL)
        color = await getAverageColor(image)
    }
    context.fillStyle = color; 
    context.fillRect(0, 0, width, height)

    context.textBaseline = 'top'

    context.fillStyle = '#fff'
    context.font = 'bold 22px GothamBlack'
    var ctext = text.split("").join(String.fromCharCode(8202))
    context.fillText(ctext, songX, songY)
    context.font = 'bold 100px GothamBlack'
    context.fillText(songName, songNameX, songNameY)
    context.font = 'bold 40px GothamBook'
    artistString = artistList.join(", ")

    context.fillText(artistString, songArtistX, songArtistY)
    context.font = '20px GothamBold'
    var cbottomText = bottomText.split("").join(String.fromCharCode(8202))
    context.fillText(cbottomText, bottomTextX, bottomTextY)
    loadImage('./logo/Spotify_logo_with_text.svg').then(image => {
        context.drawImage(image, 960, 520, 199.64, 60)
        loadImage(imageURL).then(image=> {
            context.drawImage(image, imageX, imageY, imageWidth, imageHeight)
            const buffer = canvas.toBuffer('image/png')
            const cardURL = buffer.toString('base64')
            const img = Buffer.from(cardURL, 'base64');
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': img.length
            })
            res.end(img)
        })
    })
}


// Function ID, Color 
async function searchTracksbyID(id, color, res) {
    let totalArtist;
    let artistList = [];
    let artistString = '';
    let songName;
    let imageURL;
    const width = 1200
    const height = 630
    const imageX = 105;
    const imageY = 115;
    const imageWidth = 400
    const imageHeight = 400
    const songX = 560
    const songY = 200
    const songNameX = 560
    const songNameY = 250
    const songArtistX = 560
    const songArtistY = 380
    const bottomTextX = 805
    const bottomTextY = 542
    const text = 'SONG'
    const bottomText = 'LISTEN ON'

    var data;
    try {
        data = await spotifyApi.getTrack(id, {market:'US', limit:1, offset:5})
    } catch (e) {
        res.send("Invalid ID")
        return false;
    }

    // Track Name
    songName = data.body.name;

    // Image URL 640x640
    imageURL = data.body.album.images[0].url

    // Artist List
    totalArtist = data.body.album.artists.length;

    for (let i = 0; i < totalArtist; i++) {
        artistList[i] = data.body.album.artists[i].name;
    }

    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    if (color === "#000") {
        const image = await loadImage(imageURL)
        color = await getAverageColor(image)
    }
    context.fillStyle = color;
    context.fillRect(0, 0, width, height)

    context.textBaseline = 'top'

    context.fillStyle = '#fff'
    context.font = 'bold 22px GothamBlack'
    var ctext = text.split("").join(String.fromCharCode(8202))
    context.fillText(ctext, songX, songY)
    context.font = 'bold 100px GothamBlack'
    context.fillText(songName, songNameX, songNameY)
    context.font = 'bold 40px GothamBook'

    artistString = artistList.join(", ")
    console.log(artistList)
    console.log(artistString)

    context.fillText(artistString, songArtistX, songArtistY)
    context.font = '20px GothamBold'
    var cbottomText = bottomText.split("").join(String.fromCharCode(8202))
    context.fillText(cbottomText, bottomTextX, bottomTextY)
    loadImage('./logo/Spotify_logo_with_text.svg').then(image => {
        context.drawImage(image, 960, 520, 199.64, 60)
        loadImage(imageURL).then(image=> {
            context.drawImage(image, imageX, imageY, imageWidth, imageHeight)
            const buffer = canvas.toBuffer('image/png')
            const cardURL = buffer.toString('base64')
            const img = Buffer.from(cardURL, 'base64');
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': img.length
            })
            res.end(img)
        })
    })
}








// Index
app.get('/', (req, res) => {
    // Currently Only Song Name
    res.sendFile(path.join(__dirname, 'public/index.html'))

});

// API
app.get('/api', (req, res) => {
    let imageColor = '#000';
    let songName = req.query.name;
    let songID = req.query.id;
    if (req.query.color != null){
        imageColor = '#' + req.query.color
    }
    if (songName != null && songID == null){
        searchTracksbyName(songName, imageColor, res);
    } else if (songID != null && songName == null) {
        searchTracksbyID(songID, imageColor, res);
    } else {
        res.send('name or id not provided or both provided instead of one')
    }
})

// Running Server
app.listen(port, () => {
    console.log(`app listening at http://localhost:${port}`)
});
