const express = require('express');

const shortid = require('short-id');

const mysql = require('mysql');


const app = express();

app.use(express.urlencoded({extended:false}));

app.set('view engine', 'ejs');

const db = mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'storage'
})
db.connect((err) => {
    if(err){
        console.log('error in db connection');
        return;
    }
    console.log('connection to db succesful');
})

function getlinks(req,res){
    db.query("SELECT * FROM `url`",(err,results)=>{
        if(err){
            console.log(err);
            return;
        }
        else{
            res.render('home',{results:results});
        }
    })
}

app.get('/',(req,res) => {
    getlinks(req,res);
})

app.post('/shortUrl' , (req,res) => {
    const fullUrl = req.body.fullUrl;
    const customShortUrl = req.body.customshortUrl;
    console.log(fullUrl);

    if(!fullUrl){
        return res.sendStatus(404);
    }

    if (customShortUrl.length > 0) {
        db.query("SELECT * FROM `url` WHERE shortURL = ?", [customShortUrl], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).send('Internal server error');
            }

            if (results.length > 0) {
                return res.status(400).send('Custom short URL already exists. Please choose another one.');
            }

            // Custom short URL is unique, insert it into the database
            const url = { URL: fullUrl, shortURL: customShortUrl, counts: 1 };

            db.query("INSERT INTO `url` SET ?", url, (err) => {
                if (err) {
                    console.error('Error in inserting data:', err);
                    return res.status(500).send('Internal server error');
                }

                getlinks(req, res);
            });
        });
    } 
    else {
        db.query('SELECT *  FROM `url` WHERE `URL` = ?',[fullUrl], (err,results)=>{
            if(err){
                console.log(err);
                return res.sendStatus(404);
            }
    
            if(results.length === 0){
                const short = shortid.generate();
                const url = {URL:req.body.fullUrl,shortURL:short,counts:1};
    
                db.query("INSERT INTO `url` SET ?",url,(err,res)=>{
                    if(err){
                        console.log('error in inserting data');
                        return;
                    }
                });
                getlinks(req,res);
            }
            else{
                const _short = results[0].shortURL;
                const _counts = results[0].counts;
    
                db.query("UPDATE `url` SET `counts` = ? WHERE `shortURL` = ?",[_counts+1,_short],(err,res)=>{
                    if(err){
                        console.log('error in updating the table');
                        return;
                    }
                });
                getlinks(req,res);
            }
        })
    }
});


app.get('/:shortURL',(req,res) =>{
    db.query("SELECT * FROM `url` WHERE `shortURL` = ?",[req.params.shortURL],(err,results) =>{
        if(err){
            console.log(err);
            return res.sendStatus(404);
        }

        if(results.length === 0){
            console.log('length is 0');
            return res.render("error");
        }

        else{
            console.log('happy');
            res.redirect(results[0].URL);
        }
    })
})

app.listen(1001,() => {
    console.log('app is listening on 1001');
})

