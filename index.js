var twitter = require('twitter');
var $$ = require('./CrankyCollection')
const request = require('request');
var crypto = require('crypto')
var kuromoji = require('kuromoji');

var twit = new twitter(require('./tokens.js'));
/*
tokensには
consumer_key: '',
consumer_secret: '',
access_token_key: '',
access_token_secret: ''
をmodule.exports

 */
// この builder が辞書やら何やらをみて、形態素解析機を造ってくれるオブジェクトです。
var builder = kuromoji.builder({
    // ここで辞書があるパスを指定します。今回は kuromoji.js 標準の辞書があるディレクトリを指定
    dicPath: 'node_modules/kuromoji/dict'
});

builder.build(function(err, tokenizer) {
    // 辞書がなかったりするとここでエラーになります(´・ω・｀)
    if (err) { throw err; }

    function dajareCheck(w) {
        var word = w

        word = word.replace(/[「」、。!?！？・]/g, "");
        var alpha = ["エー", "ビー", "シー", "ディー", "イー", "エフ", "ジー", "エッチ", "アイ", "ゼー", "ケー", "エル", "エム", "エン", "オー", "ピー", "キュー", "アール", "エス", "ティー", "ユー", "ブイ", "ダブリュー", "エックス", "ワイ", "ゼット"]

        alpha.forEach((r, i) => {
            var sreg = new RegExp(String.fromCharCode(65 + i), 'gi');
            word = word.replace(sreg, r);
        })

        for (var i = 0; i < 10; i++) {
            word = word.replace(new RegExp(i, 'g'), ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"][i])
        }

        console.log(`->${word}`);

        // tokenizer.tokenize に文字列を渡すと、その文を形態素解析してくれます。
        var tokens = tokenizer.tokenize(word);
        var reading = tokens.map(w => { return w.reading }).join('');
        var meishis = tokens.filter(w => {
            return w.pos === "名詞"
        })

        // console.log(tokens)

        var arrs = [];
        for (var len = tokens.length - 1; len > 0; len--) {
            for (var index = 0; index < tokens.length - len; index++) {
                var tmp = JSON.parse(JSON.stringify(tokens[index]));
                tmp.reading || (tmp.reading = tmp.surface_form)
                tmp.ids = [tmp.word_position]
                for (var i = 1; i < len; i++) {
                    tmp.reading += tokens[i + index].reading || tokens[i + index].surface_form;
                    tmp.surface_form += tokens[i + index].surface_form;
                    tmp.ids.push(tokens[i + index].word_position)
                }
                arrs.push(tmp)
            }
        }

        var score;

        var flag = arrs.some((meishi) => {
            if (!meishi.reading) { return }
            var ignoreReading = tokens.filter(w => {
                // console.log(w)
                return !meishi.ids.some((tw) => {
                    return w.word_position <= tw
                })
            }).map(w => { return w.reading || w.surface_form }).join('');
            var serchreg = meishi.reading;
            serchreg = serchreg.replace(/ッ/g, 'ッ*');
            serchreg = serchreg.replace(/ー/g, 'ー*');
            serchreg = serchreg.replace(/。/g, '。*');
            serchreg = serchreg.replace(/、/g, '、*');
            ignoreReading = ignoreReading.replace(/ッ/g, '');
            if (meishi.reading.length>2&&(new RegExp(serchreg)).test(ignoreReading)) {
                var retText = `ダジャレを検知しました。`
                console.log(meishi.surface_form)
                var pars = meishi.reading.length / (ignoreReading.length);
                var score1 = pars
                var t = tokenizer.tokenize(word)
                var ms = t.filter((s) => { return s.pos == "名詞" }).length
                var score2 = 1. - (ms / t.length);
                score = score1 * score2;
                score *= 100;
                return true;
            } else {}
        })
        if (!flag) {
            console.log("ダジャレは検知されませんでした")
            return false;
        } else {
            return score
        }
    }

    twit.stream('user', {}, (stream) => {
        stream.on('data', (data) => {
            if('retweeted_status' in data){return}
            if(data.in_reply_to_user_id!==null){return}
            var ret = dajareCheck(data.text);
            if(ret!==false){
                var send = `ダジャレを検知しました！\nあなたのダジャレは${ret.toFixed(2)}点です！`
                twit.post('statuses/update',{
                    'status':`@${data.user.screen_name} ${send}`,
                    'in_reply_to_status_id':data.id_str
                })
            }
        })
    })

});

function Larger(a, b) {
    if (a.length > b.length) { return true; }
    if (a.length < b.length) { return false; }
    var arra = a.split('');
    var arrb = b.split('');
    for (var i = 0; i < arra.length; i++) {
        if (arra[i] < arrb[i]) { return false };
        if (arra[i] > arrb[i]) { return true };
    }
    return false;
}
setInterval(() => {}, 10000)