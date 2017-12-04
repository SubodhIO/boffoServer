var express=require('express');
var path = require('path');
var app = express();

const PORT = process.env.PORT || 5000;


app.use(express.static(path.join(__dirname,'public')));

app.listen(PORT,function(){
    console.log('Boffo server started @'+PORT);
});

app.get('/',function(req,res){
    res.redirect('pages/index.html');
});