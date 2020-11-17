
const path = require( 'path' );
const express = require( 'express' );
const getPort = require( 'get-port' );
const open = require( 'open' );

(async function() {
    const app = express();
    const port = await getPort({ port: 3000 });
    const host = `http://127.0.0.1:${ port }`;

    app.use('/web', express.static(path.join(__dirname, './src/www')));

    app.get( '/api/answers/:idx', (req, res ) => {
        res.contentType('application/json');
        res.sendFile( path.join(__dirname, `./src/static/answers${req.params.idx}.json`));
    });

    app.listen(port, async () => {
        await open( `${ host }/web` );
    });
})();
