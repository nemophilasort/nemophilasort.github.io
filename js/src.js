$(document).ready(function() {

	$("#btn-rawtext, .menu-link").hover(function() {
		$(this).css("background-color", "#FFF");
		$(this).css("color", "#000");
	},function() {
		$(this).css("background-color", "#000");
		$(this).css("color", "#fff");
	});

	$("#fldLeft, #fldMiddleT, #fldRight, #fldMiddleB").hover(function() {
		$(this).css("background-color", "#fff");
		$(this).css("color", "#000");
	}, function() {
		$(this).css("background-color", "#000");
		$(this).css("color", "#fff");
	});

	$("#menu-restart").click(function() {
		location.reload();
	});

});
