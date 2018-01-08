$(".beepOnClick").on("click",function(event){
	playRandomBeep();
})

function playRandomBeep(){
	var audio = new Audio('/randomBeep?id=' + Math.random());
	audio.play();
}	

var INTERSTELLAR_UI_CURRENTLY_SELECTED_CORE_WINDOW_DRAGING_TARGET = undefined;
var INTERSTELLAR_UI_CURRENTLY_SELECTED_CORE_WINDOW_DRAGING_TOP_Z_INDEX = 25555;
//long crazy name in hopes it will never be seen by anybody else's code
$(".Core_Theme-CoreWidget").append("<div class='coreWidgetMoveContainer'></div>");
$(".Core_Theme-CoreWidget").append("<div class='coreWidget-topResize'></div>");
$(".Core_Theme-CoreWidget").append("<div class='coreWidget-bottomResize'></div>");
$(".Core_Theme-CoreWidget").append("<div class='coreWidget-leftResize'></div>");
$(".Core_Theme-CoreWidget").append("<div class='coreWidget-rightResize'></div>");
$(".Core_Theme-CoreWidget").append("<div class='coreWidget-topRightCornerResize'></div>");
$(".Core_Theme-CoreWidget").append("<div class='coreWidget-bottomRightCornerResize'></div>");
$(".Core_Theme-CoreWidget").append("<div class='coreWidget-bottomLeftCornerResize'></div>");
$(".Core_Theme-CoreWidget").append("<div class='coreWidget-topLeftCornerResize'></div>");

$( ".coreWindow" ).each(function() {
	var windowName = $(this).attr("windowName");
	if(windowName == "" || windowName == undefined){
		windowName = "Untitled"
	}
	var heightOfCoreWindow = $(this).height() - 40;

	$( this ).prepend("<div class='coreWindowMoveTrigger' style='cursor: -webkit-grab;width: 100%;height: 20px;background: linear-gradient(to bottom, #eeeeee 0%,#cccccc 100%);''><span class='coreWindowTitle'>" + windowName + "</span><div class='coreWindowCloseButton' onmouseup='closeCoreWindow(this.parentNode.parentNode.id)'></div></div>");
	let windowElement = this;
	setTimeout(function(){
		$( windowElement ).append("<div style='width: 100%;height: 20px;background: linear-gradient(to top, #eeeeee 0%,#cccccc 100%);position: absolute;bottom: 0px'></div>");
	},0100);
});


function interstellarDropDownMenu(type,text,callbackPassed){
	let callback = callbackPassed;
	switch(type){
		case "password":
			$("#INTERSTELLAR_DROP_DOWN_INPUT_FIELD_TEXTAREA").css("display","none");
			$("#INTERSTELLAR_DROP_DOWN_INPUT_FIELD_PASSWORD-AREA").css("display","block");

			$("#INTERSTELLAR_DROP_DOWN_INPUT_FIELD_TEXT").html(text);
			$("#INTERSTELLAR_DROP_DOWN_INPUT_FIELD").slideDown();
			$("#INTERSTELLAR_DROP_DOWN_INPUT_FIELD_PASSWORD").off();
			$("#INTERSTELLAR_DROP_DOWN_INPUT_FIELD_PASSWORD").keypress(function(event){
				if(event.which == 13){
					$("#INTERSTELLAR_DROP_DOWN_INPUT_FIELD").slideUp();
					callback(event.target.value);
				}
			});
		break;
		case "text":
			$("#INTERSTELLAR_DROP_DOWN_INPUT_FIELD_TEXTAREA").css("display","block");
			$("#INTERSTELLAR_DROP_DOWN_INPUT_FIELD_PASSWORD-AREA").css("display","none");


			$("#INTERSTELLAR_DROP_DOWN_INPUT_FIELD_TEXT").html(text);
			$("#INTERSTELLAR_DROP_DOWN_INPUT_FIELD").slideDown();
			$("#INTERSTELLAR_DROP_DOWN_INPUT_FIELD_TEXTFIELD").off();
			$("#INTERSTELLAR_DROP_DOWN_INPUT_FIELD_TEXTFIELD").keypress(function(event){
				if(event.which == 13){
					callback(event.target.value);
				}
			});
		break;
	}
}

$(".coreWindowMoveTrigger").mousedown(function(event){
	if($(event.target).attr('class') == "coreWindowCloseButton"){
		return;
	}
	if($(event.target).attr('class') == "coreWindowTitle"){
		event.target = event.target.parentNode;
	}
	INTERSTELLAR_UI_CURRENTLY_SELECTED_CORE_WINDOW_DRAGING_TARGET = event.target.parentNode;
	if(INTERSTELLAR_UI_CURRENTLY_SELECTED_CORE_WINDOW_DRAGING_TOP_Z_INDEX < $(INTERSTELLAR_UI_CURRENTLY_SELECTED_CORE_WINDOW_DRAGING_TARGET).css("z-index")){
		INTERSTELLAR_UI_CURRENTLY_SELECTED_CORE_WINDOW_DRAGING_TOP_Z_INDEX = $(INTERSTELLAR_UI_CURRENTLY_SELECTED_CORE_WINDOW_DRAGING_TARGET).css("z-index") + 1;
		$(INTERSTELLAR_UI_CURRENTLY_SELECTED_CORE_WINDOW_DRAGING_TARGET).css("z-index",INTERSTELLAR_UI_CURRENTLY_SELECTED_CORE_WINDOW_DRAGING_TOP_Z_INDEX);
	}
	var zIndex = 2147483647;
	$('body').append("<div class='INTERSTELLAR_UI_CURRENTLY_SELECTED_CORE_WINDOW_DRAGING_MOUSE_CATCHER' style='position:absolute;top:0px;left:0px;width:100%;height:100%;cursor:-webkit-grabbing;z-index:" + zIndex + ";'></div>");
	$(event.target.parentNode).css("zIndex",zIndex - 2);
	let offsetX = event.offsetX;
	let offsetY = event.offsetY;
	$(".INTERSTELLAR_UI_CURRENTLY_SELECTED_CORE_WINDOW_DRAGING_MOUSE_CATCHER").mousemove(function(event){
		if(INTERSTELLAR_UI_CURRENTLY_SELECTED_CORE_WINDOW_DRAGING_TARGET != undefined){
			var newX = event.pageX - offsetX;
			var newY = event.pageY - offsetY;
			if(newX < 0){
				newX = 0;
			}
			if(newY < 0){
				newY = 0;
			}
			if(newX + $(INTERSTELLAR_UI_CURRENTLY_SELECTED_CORE_WINDOW_DRAGING_TARGET).width() >= $( window ).width()){
				newX = $( window ).width() - $(INTERSTELLAR_UI_CURRENTLY_SELECTED_CORE_WINDOW_DRAGING_TARGET).width();
				newX -= 5;
			}
			if(newY + $(INTERSTELLAR_UI_CURRENTLY_SELECTED_CORE_WINDOW_DRAGING_TARGET).height() >= $( window ).height()){
				newY = $( window ).height() - $(INTERSTELLAR_UI_CURRENTLY_SELECTED_CORE_WINDOW_DRAGING_TARGET).height();
				newY -= 5;
			}
			$(INTERSTELLAR_UI_CURRENTLY_SELECTED_CORE_WINDOW_DRAGING_TARGET).css("left",newX);
			$(INTERSTELLAR_UI_CURRENTLY_SELECTED_CORE_WINDOW_DRAGING_TARGET).css("top",newY);
		}
	});
	$(".INTERSTELLAR_UI_CURRENTLY_SELECTED_CORE_WINDOW_DRAGING_MOUSE_CATCHER").mouseup(function(event){
		INTERSTELLAR_UI_CURRENTLY_SELECTED_CORE_WINDOW_DRAGING_TARGET = undefined;
		$(".INTERSTELLAR_UI_CURRENTLY_SELECTED_CORE_WINDOW_DRAGING_MOUSE_CATCHER").remove(INTERSTELLAR_UI_CURRENTLY_SELECTED_CORE_WINDOW_DRAGING_TARGET);
	});
});