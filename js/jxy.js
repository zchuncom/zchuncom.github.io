if(window.location.href == 'http://www.juxiangyou.com/login/index?redirectUrl=/fun/play/speed16/index') {
loginSpeed16();
} else if(window.location.href == 'http://www.juxiangyou.com/fun/play/speed16/index') {
speed16uihidden();
endtime();
}

function speed16uihidden() {
$(".fun-header").hide();
$('.block-right').hide();
$("#jxy_footer").hide();
$(".block-main").css("margin", "0 auto").css("float", "none");
}

function loginSpeed16(){
$('#account').val('i@zchun.com');
$('#password').val('21505264');
$('#code').focus();
}


function endtime() {
if($(".J_endTime").text() != '') {
var jz = Date.now() + parseInt($(".J_endTime").text()) * 1000;
var kj = jz + 10 * 1000;

var jz1 = Math.round((jz - Date.now())/1000);
var kj1 = jz1 + 10;



if(top.jz != jz1) {
try{JS16.endtime(jz1);}catch(e){}
//console.log('½ØÖÁ:' + jz1 + "/s" + " " + '¿ª½±:' + kj1 + "/s");
}

top.jz = jz1;

setTimeout(endtime, 100);
}
}