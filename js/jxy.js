if(window.location.href == 'http://www.juxiangyou.com/login/index?redirectUrl=/fun/play/speed16/index') {
loginSpeed16();
} else if(window.location.href == 'http://www.juxiangyou.com/fun/play/speed16/index') {
speed16uihidden();
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
