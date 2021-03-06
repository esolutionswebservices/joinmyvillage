/**
* @package main.js
*/

/**
* Join My Village Story - Provides functionality to transition user through the Join My Village story.
*
* 
* @author Chris Stromquist <chris@esolutionswebservices.com>
* 	@cstromquist
* 	http://www.linkedin.com/pub/chris-stromquist/7/298/581
* 	www.esolutionswebservices.com
*
* $Id: main.js 43 2012-08-31 21:28:53Z chris $
* @version 1.0
*
* @copyright (C) 2012 by Chris Stromquist - eSolutions Web Services
*/

'use strict';

var Config = {
	uuid: function(a,b){for(b=a='';a++<36;b+=a*51&52?(a^15?8^Math.random()*(a^20?16:4):4).toString(16):'-');return b},
	root_url: document.domain,
	subdirectory: '/',
	sub_url: '?chapter=',
	getUrl: function() {
		return this.root_url + this.subdirectory;
	}
};

var Story = {
	chapters: 7,
	chapter_open_status: {1:false, 2:false, 3:false, 4:false, 5:false, 6:false, 7:false},
	chapter_close_status: {1:false, 2:false, 3:false, 4:false, 5:false, 6:false, 7:false},
	current_chapter: null,
	next_chapter: null,
	previous_chapter: null,
	init: function() {
		$.ajaxSetup({
			cache: false
		});
		this.setChapter(this.getChapter());
		this.openStory();
	},
	openStory: function(showModal) {
		if(!$.cookie('current_chapter') || showModal == true) {
			Scroll.preventScrolling();
			var modal = $('#modal-entry');
			modal.fadeIn('slow');
			modal.modal({
				position: ['15%',],
				onClose: function (dialog) {
				dialog.data.animate({left:'-=2000px'}, 2000, function () {
					dialog.overlay.fadeOut(1200, function () {
						Scroll.enableScrolling();
						$.modal.close(); // must call this!
					});
				});
				Story.begin();
			}});
		} else {
			Story.begin();
		}
	},
	begin: function() {
		if(this.current_chapter != this.chapters)
			LikesModal.init(this.current_chapter);
		Likes.init(function() {
			if (Story.validateChapter()) {
				//console.log('Chapter ' + Story.current_chapter + ' is valid and can be opened...');
				Story.bindFixedElements();
				Story.openChapter();
			} else {
				//console.log('Chapter ' + Story.current_chapter + ' is not yet available...');
				Story.setChapter(Story.previous_chapter);
				Story.begin();
			}
			//console.log(Likes);
		});
	},
	end: function() {
		var modal = $('#modal-end');
		modal.fadeIn('slow');
		modal.modal();
	},
	bindFixedElements: function() {
		var lastScroll = 0;
		$(window).bind('scroll', function() {
			$('#header .social-media').css('top', 35-$(window).scrollTop() + 'px');
			$('#header .jmv-logo').css('top', 20-$(window).scrollTop() + 'px');
		});
	},
	getChapter: function() {
		var param = decodeURI((RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]);
		var chapter = null;
		if(param != 'null' && !isNaN(Number(param))) {
			chapter = Number(param);
		} else if(chapter = $.cookie('current_chapter')) {
			if(isNaN(chapter))
				chapter = 1;
			else
				chapter = Number(chapter);
		} else {
			chapter = 1;
		}
		if(chapter > Story.chapters)
			chapter = 1;
		return chapter;
	},
	setChapter: function(chapter) {
		this.current_chapter = chapter;
		this.next_chapter = chapter + 1;
		this.previous_chapter = chapter == 1 ? 1 : chapter - 1;
	},
	getChapterWidth: function ( chapter ) {
		var width = Number($('#chapter-' + chapter).width());
		return width;
	},
	getUrl: function(chapter) {
		chapter = chapter ? Number(chapter) : Story.current_chapter;
		var url = Config.getUrl();
		//if(chapter > 1) {
			url += Config.sub_url + chapter;
		//}
		return url;
	},
	chapterStartPoint: function( chapter ) {
		var total = 0;
		for(var i=1; i<chapter; i++) {
			total += this.getChapterWidth(i);
		}
		return total;
	},
	openNextChapter: function () {
		// make sure we only increment below the high chapter
		if(this.current_chapter < Story.chapters) {
			Story[this.current_chapter].status = false;
			this.current_chapter = this.current_chapter + 1;
			// make sure to validate
			Story.begin();
		}
	},
	redirectToNextChapter: function() {
		var next_chapter = this.current_chapter + 1;
		window.location.href = 'http://' + Config.root_url + Config.subdirectory + Config.sub_url + next_chapter;
	},
	validateChapter: function() {
		// check to make sure the previous chapter can be opened.  If not, go to previous chapter until we find an open one.
		if(Story.current_chapter != 1 && !Likes[Story.previous_chapter].limit_reached) {
			return false;
		}
		return true;
	},
	openChapter: function() {
		if(!this.chapter_open_status[this.current_chapter]) {
			this.chapter_open_status[this.current_chapter] = true
		}
		$.cookie('current_chapter', this.current_chapter, { expires: 7 });
		this.setWidth(this.current_chapter);
		// open all chapters before this one
		for(var i=1; i<=Story.current_chapter; i++) {
			$('#chapter-' + i).delay(300).fadeIn(1000);
		}
		//scroll to chapter, then open it
		this.scrollToChapter();
	},
	closeChapter: function(chapter) {
		this.chapter_close_status[chapter] = true;
	},
	setWidth: function( chapter ) {
		var width = 0;
		for(var i=1; i<=chapter; i++) {
			width += this.getChapterWidth(i);
		}
		this.width = width;
		$('#footer').css('width', this.width + 'px');
		$('#container').css('width', this.width + 'px');
		$('#story').css('width', this.width + 'px');
	},
	scrollToChapter: function() {
		$('html, body').stop().animate({
            scrollLeft: Story.chapterStartPoint(Story.current_chapter)
        }, 3000, function() {
        	Story[Story.current_chapter].status = true;
        	Story[Story.current_chapter].open();
        	Boxes.init();
			Flags.init();
        });
	},
	preload: function() {	
		$('#loading-container').show();
		$('#container').hide();
		$('#loading-container').delay(1000).fadeOut(800);
		$('#container').delay(1000).fadeIn(1600);
	},
	animateObject: function( object, delay, speed ) {
		$(object).
  		delay(delay).
  		animate({opacity:1,bottom:'0px'},speed);
	},
	/**********************************
	 * BEGIN CHAPTER OBJECTS
	 * Controls each chapter's behaviors
	 **********************************/
	// Chapter 1
	1: {
		status: false,
		open: function() {
			this.animate();
			this.bindScrollPoints();
			Maya.enter('child');
			Boxes.show(1,1); //slide in the first box
			$('#flag-11').click(function(){
				$('#learn-more').hide();
			});
		},
		animate: function() {
			//Story.animateObject('#tree-1', 2400, 800);
			//Story.animateObject('#hill-1', 2800, 800);
			
			// cloud animations
			$("#cloud-11").
		    animate({left:'+=-600px', opacity:0.0}, 27000).
		    animate({left:'+=600px'},0).
		    animate({opacity:0.8},3000);
		    
		    this.blinkKeyboard();
		    this.blinkLearnMore();
		},
		blinkKeyboard: function() {
			if(!$('#instructions').attr('disabled')) {
				$('#instructions').
					removeClass('instructions').
					addClass('keyboard').
					animate({opacity: 1}, 1500).
					animate({opacity: 0}, 1500, function() {
						$(this).
							removeClass('keyboard').
							addClass('instructions');
					}).
					animate({opacity: .4}, 1500).
					animate({opacity: 0}, 1500, Story[1].blinkKeyboard);
			}
		},
		blinkLearnMore: function() {
			$('#learn-more').
				animate({opacity: 1}, 1500).
				animate({opacity: 0}, 1500, Story[1].blinkLearnMore);
		},
		bindScrollPoints: function() {
			$(window).bind('scroll', function() {
				if (Maya.xPosition() > 400) {
					$('#instructions').hide();
					$('#instructions').attr('disabled', true);
				}
		    	if (Maya.xPosition() > 2000 && Maya.xPosition() < 3000) {
		    		Animations.animateCrops(1);
		    	}
		    	if (Maya.xPosition() > 2400 && Maya.xPosition() < 3000) {
		    		Animations.animateCrops(1);
		    	}
		    	if (Maya.xPosition() > 2800 && Maya.xPosition() < 3300) {
		    		$('#girl-11').animate({bottom: '110px'}, 3500);
		    	}
		    	if (Maya.xPosition() > 3800 && Maya.xPosition() < 4000) {
		    		$('#boy-11').animate({bottom: '110px'}, 4500);
					$('#boy-12').animate({bottom: '120px'}, 4000);
		    	}
	    	});
		},
		close: function() {
			//Maya.exit();
		}
	},
	// Chapter 2
	2: {
		status: false,
		open: function() {
			Maya.enter('child');
			this.bindScrollPoints();
			Animations.water_position = $('#chapter-2 #water-front-21').position().left;
			Animations.chapter = 2; 
			Animations.animateWater();
			this.animateParachutes();
		},
		animateParachutes: function() {
			if(Story.current_chapter == 2) {
				// float parachutes
				$('#chapter-2 #parachute-21').
					animate({top:'200px'}, 2500, 'linear').
					animate({top:'120px'}, 2500, 'linear', Story[2].animateParachutes);
				$('#chapter-2 #parachute-22').
					animate({left:'-=50px'}, 3500, 'linear').
					animate({left:'+=50px'}, 3500, 'linear');
				$('#chapter-2 #parachute-23').
					animate({top:'+=50px'}, 4500, 'linear').
					animate({top:'-=50px'}, 4500, 'linear');
			}
		},
		bindScrollPoints: function() {
			$(window).bind('scroll', function() {
				var bubble = $('#chapter-2 #bubble-21');
				if (Maya.xPosition() > Story.chapterStartPoint(2) + 4400 && bubble.css('opacity') == 0) {
		    		bubble.animate({opacity:1}, 1000);
		    	}
		  });
		},
		close: function() {
			//Maya.exit();
		}
	},
	// Chapter 3
	3: {
		status: false,
		plane_flown: false,
		open: function() {
			Maya.enter('child');
			this.animate();
			this.bindScrollPoints();
		},
		animate: function() {
			this.animateParachutes();
		},
		animateParachutes: function() {
			if(Story.current_chapter == 3) {
				// float parachutes
				$('#chapter-3 #parachute-31').
					animate({top:'+=200px'}, 5500, 'linear').
					animate({top:'-=200px'}, 5500, 'linear', Story[3].animateParachutes);
			}
		},
		bindScrollPoints: function() {
			$(window).bind('scroll', function() {
		    	if (Maya.xPosition() > Story.chapterStartPoint(3) + 1450 && Maya.current_life_stage == 'child') {
		    		Maya.lifeTransition('teen'); // Maya becomes a teenager
		    	}
		    	if (Maya.xPosition() > $('#chapter-3 #bubble-31').position().left - 200 && !$('#chapter-3 #bubble-31').attr('disabled')) {
		    		$('#chapter-3 #bubble-1').animate({opacity:1}, 1000);
		    	}
		    	if (Maya.xPosition() > $('#chapter-3 #bubble-32').position().left - 200 && !$('#chapter-3 #bubble-32').attr('disabled')) {
		    		$('#chapter-3 #bubble-2').animate({opacity:1}, 1000);
		    	}
		    	if (Maya.xPosition() > $('#chapter-3 #bubble-31').position().left + 50 && !$('#chapter-3 #bubble-31').attr('disabled')) {
		    		$('#chapter-3 #bubble-1').removeClass('bubble-marriage').
						addClass('bubble-burst').
						attr('disabled', true).
						fadeOut(2000);
		    	}
		    	if (Maya.xPosition() > $('#chapter-3 #bubble-32').position().left + 50 && !$('#chapter-3 #bubble-32').attr('disabled')) {
		    		$('#chapter-3 #bubble-2').removeClass('bubble-baby').
						addClass('bubble-burst-right').
						attr('disabled', true).
						fadeOut(2000);
		    	}
		    	if (Maya.xPosition() > Story.chapterStartPoint(3) + 2300 && Story[3].plane_flown != true) {
		    		$("#plane-31").animate({left: '+=600px'}, 2000)
		    		Story[3].plane_flown = true;
		    		Animations.animatePlane();
		    	}
		    	if (Maya.xPosition() > $('#chapter-3 #tree-34').position().left - 600 && !$('#chapter-3 #tree-34 img').attr('disabled')) {
		    		$('#chapter-3 #tree-34 img').css('display', 'block').attr('src', 'img/animations/moneytree.gif').attr('disabled', true);
		    		$('#chapter-3 #tree-34').
		    			removeClass('tree-money-start').css('height', 451);
		    		
		    	}
	    	});
		},
		close: function() {
			//Maya.exit();
		}
	},
	// Chapter 4
	4: {
		status: false,
		open: function() {
			Maya.enter('teen');
			this.animate();
			this.bindScrollPoints();
		},
		animate: function() {
			
		},
		bindScrollPoints: function() {
			$(window).bind('scroll', function() {
		    	if (Maya.xPosition() > Story.chapterStartPoint(5)-1500 && Maya.xPosition() < Story.chapterStartPoint(5)-1200) {
		    		Animations.animateCrops(4);
		    	}
		    	if (Maya.xPosition() > Story.chapterStartPoint(4) + 2400 && Maya.current_life_stage == 'teen') {
		    		Maya.lifeTransition('woman'); // Maya becomes a woman
		    	}
	    	});
		},
		close: function() {
			//Maya.exit();
		}
	},
	// Chapter 5
	5: {
		status: false,
		man_chosen: false,
		open: function() {
			Maya.enter('woman');
			this.animate();
			this.bindScrollPoints();
		},
		animate: function() {
			var stars = $('#girl-51 #stars-51');
			stars.css({bottom: '50px'});
			stars.animate({opacity:1}, 2000).animate({opacity:0}, 2000);
			
			var stars = $('#girl-52 #stars-52');
			stars.css({bottom: '50px'});
			stars.animate({opacity:1}, 2000).animate({opacity:0}, 2000);
		},
		bindScrollPoints: function() {
			$(window).bind('scroll', function() {
		    	if (Maya.xPosition() > Story.chapterStartPoint(5)+1200 && Maya.xPosition() < Story.chapterStartPoint(5)+2000) {
		    		Animations.animateCrops(5);
		    	}
		    	if (Maya.xPosition() > Story.chapterStartPoint(5) + 1900 && Maya.current_life_stage == 'woman') {
		    		Maya.lifeTransition('pregnant'); // Maya becomes pregnant
		    	}
		    	if (Maya.xPosition() > Story.chapterStartPoint(5) + 1300 && Story[5].man_chosen != true) {
		    		var chosen_man = $('#chapter-5 #man-53');
		    		chosen_man.removeClass('man-3').addClass('husband-animation').animate({left: '+=650px'}, 4000)
		    		Story[5].man_chosen = true;
		    		
		    	}
	    	});
		},
		close: function() {
			//Maya.exit();
		}
	},
	// Chapter 6
	6: {
		status: false,
		open: function() {
			Maya.enter('mother', true);
			this.bindScrollPoints();
			this.animate();
		},
		animate: function() {
			Animations.water_position = $('#chapter-6 #water-front-61').position().left;
			Animations.chapter = 6; 
			Animations.animateWater();
		},
		bindScrollPoints: function() {
			$(window).bind('scroll', function() {
		    	if (Maya.xPosition() > Story.chapterStartPoint(6)+400 && Maya.xPosition() < Story.chapterStartPoint(6)+1200) {
		    		Animations.animateCrops(6);
		    	}
		    	if (Maya.xPosition() > Story.chapterStartPoint(6) + 200 && Maya.current_life_stage == 'pregnant') {
		    		Maya.lifeTransition('mother'); // Maya enters motherhood
		    	}
	    	});
		},
		close: function() {
			//Maya.exit();
		}
	},
	// Chapter 7
	7: {
		status: false,
		end: false,
		open: function() {
			Maya.enter('woman', true);
			this.bindScrollPoints();
		},
		animate: function() {
			
		},
		bindScrollPoints: function() {
			$(window).bind('scroll', function() {
				if(Maya.xPosition() >= Story.chapterStartPoint(7) + 2980 && Story[7].end == false) {
					Maya.pause_animation = true;
					$('#maya').css('background-position', 0);
					$('#maya').css('left', Maya.xPosition());
					$('#maya').css('position', 'absolute');
					$('#maya').removeClass('maya-woman').addClass('maya-animation').animate({left: '+=300px'}, 3000, function() {
						$(this).fadeOut();
					})
		    		Story[7].end = true;
				}
	    	});
		},
		close: function() {
			//Maya.exit();
		}
	},
	
	/*********************
	 * END CHAPTER OBJECTS
	 *********************/
};


/**************************
 * Facebook Like controller
 **************************/
var Likes = {
	chapter: null,
	previous_chapter: null,
	fbApiInit: false,
	use_remote: false,
	init: function(callback) {
		this.like_processed = false;
		this.chapter = Story.current_chapter;
		this.previous_chapter = this.chapter == 1 ? 1 : this.chapter - 1;
		this.bindFacebookLike();
		// get our counts
		$.get('config.php?setting=use_fb', function(data) {
			if(data == 1) {
				Likes.use_remote = true;
			} else {
				Likes.use_remote = false;
			}
			// 
			Likes.processLikeData();
			// get previous chapter counts
			Likes.getCounts(Likes.previous_chapter, function(count) {
				Likes.setCounts(Likes.previous_chapter, count, function() {
				if(callback)
					callback();
				});
			});
		}, 'json');
	},
	bindFacebookLike: function() {
		var url = Story.getUrl();		
		// clean fb like
        $('.facebook-like').remove();
		$('.facebook-like-wrapper').html('<div class="facebook-like"><fb:like send="false" href="' + url + '" layout="button_count" width="50" show_faces="false"></fb:like></div>');
		FB.XFBML.parse(document.getElementById('facebook-like'));
	},
	processLikeData: function() {
		var cookie = this.getCookie();
		Likes.getCounts(Likes.chapter, function(count) {
			Likes.setCounts(Likes.chapter, count, function() {
				Likes.displayCounts();
				Likes.displayPercentageBar();
				if(cookie[Likes.chapter-1]) {
					LikesModal.showThanks();
				}
			});
		});
	},
	recordLike: function() {
		$.post('likes.php',{chapter: this.chapter}, function(data) {
			Likes.setCookie();
			Likes.processLikeData();
		});
	},
	getCounts: function( chapter, callback ) {
		if(this.use_remote == false) {
			$.get('likes.php?chapter=' + chapter, function(data) {
				if(callback)
					callback(data.count);
				else
					return data.count;
			}, 'json')
		} else {
			var url = Story.getUrl(chapter);
			FB.api(
			  {
			    method: 'links.getStats',
			    urls: url
			  },
			  function(response) {
				if(callback)
					callback(response[0].like_count);
				else
					return response[0].like_count;
			  }
			);
		}
	},
	setCounts: function(chapter, count, callback) {
		var count = Number(count);
		$.get('likes.php?chapter=' + chapter, function(data) {
			var limit = Number(data.limit);
			var data = {
				'count': count,
				'limit': limit,
				'remaining': count >= limit ? 0 : (limit - count),
				'limit_reached': count >= limit ? true : false
			}
			Likes[chapter] = data;
			callback();
		}, 'json');
	},
	displayCounts: function() {
		$('#likes-modal .likes-count span.count').text(this[this.chapter].count);
		$('#likes-modal .likes-remaining span.like-count').text(this[this.chapter].remaining);
		$('#likes-modal .like-count-total span.like-count').text(this[this.chapter].limit);
		if(Likes.count != 1) {
			$('#likes-modal .likes-count span.plural').text('S');
		} else {
			$('#likes-modal .likes-count span.plural').text('');
		}
		if(Likes.remaining != 1) {
			$('#likes-modal .likes-remaining span.plural').text('S');
		} else {
			$('#likes-modal .likes-remaining span.plural').text('');
		}
	},	
	displayPercentageBar: function() {
		var percentage = (this[this.chapter].count / this[this.chapter].limit) * 100;
			if(percentage > 100)
				percentage = 100;
		$('#likes-modal #percentage-bar #percentage').animate({width: percentage + '%'}, 4000);
	},
	isLimitReached: function(chapter) {
		if(this[chapter].count >= this[chapter].limit) {
			return true;
		} else {
			return false;
		}
	},
	getCookie: function() {
		var obj = JSON.parse($.cookie('likes'));
		if(!obj)
			obj = Array();
		return obj;
	},
	setCookie: function() {
		var data = this.getCookie();
		data[Likes.chapter-1] = true;
		$.cookie('likes', JSON.stringify(data, null, 2));
		return data;
	}
}

/***********************************************
 * Likes modal object
 * Controls where the Like should be displayed 
 * (ie at the end of the next available chapter)
 ***********************************************/
var LikesModal = {
	chapter: null,
	content: [
		// Chapter 1
		{
			intro: 'Going to school is important...it is the only way Maya will ever be able to help herself, and her family.',
			like_message: 'TO HELP MAYA GO TO SCHOOL, LIKE THIS POST',
			next_chapter_message: 'Maya will be off to school, and Chapter Two will be revealed. Stay Tuned!',
			position: 4732
		},
		// Chapter 2
		{
			intro: 'Female teachers are reluctant to come to rural villages...they need a safe place to live.',
			like_message: 'TO HELP TEACHERS AND SUPPLIES GET TO MAYA\'S VILLAGE, LIKE THIS POST',
			next_chapter_message: 'Maya\'s school will open, and Chapter Three will be revealed. Stay tuned!',
			position: 4213
		},
		// Chapter 3
		{
			intro: 'Most secondary schools are boarding schools. Maya needs a scholarship to cover her expenses.',
			like_message: 'TO HELP MAYA EARN SCHOLARSHIP FUNDS, LIKE THIS POST',
			next_chapter_message: 'Maya will get her scholarship, and Chapter Four will be revealed. Stay tuned!',
			position: 4845
		},
		// Chapter 4
		{
			intro: 'Maya needs to talk with the younger girls in her village on the importance of an education.',
			like_message: 'TO HELP MAYA MENTOR YOUNGER GIRLS IN THE VILLAGE, LIKE THIS POST',
			next_chapter_message: 'all the girls will be mentored, and Chapter Five will be revealed.  Stay tuned!',
			position: 3909
		},
		// Chapter 5
		{
			intro: 'Medical professionals are needed to help Maya understand her body\'s needs and show her husband how to care for her.',
			like_message: 'TO HELP ENSURE GOOD PRENATAL CARE FOR MAYA, LIKE THIS POST',
			next_chapter_message: 'Maya will have her baby, and Chapter Six will be revealed. Stay tuned!',
			position: 4159
		},
		// Chapter 6
		{
			intro: 'As Maya\'s skill and business grow, she will earn respect and earn a chance to take a leadership position in her community.',
			like_message: 'TO HELP MAYA BORROW MONEY FROM THE VSLA, LIKE THIS POST.',
			next_chapter_message: 'Maya will receive a loan, and our story\'s ending will be revealed. Stay tuned!',
			position: 4261
		},
	],
	init: function( chapter ) {
		this.reset();
		this.bindClick();
		this.modal = $('#likes-modal');
		this.chapter = chapter;
		this.show();
	},
	bindClick: function() {
		$('#likes-modal #thanks #congrats a#continue').click(function() {
			if(!$(this).attr('disabled')) {
				$('#likes-modal').animate({opacity: 0}, 1000, function() {
					Story.openNextChapter();
				});
			};
			$(this).attr('disabled', true);
		});
	},
	show: function() {
		$('#likes-modal').animate({opacity: 1}, 2000);
		$('#likes-modal #intro').html(this.content[this.chapter-1].intro);
		$('#likes-modal .like-message').html(this.content[this.chapter-1].like_message);
		$('#likes-modal .next-chapter-message').html(this.content[this.chapter-1].next_chapter_message);
		$('#likes-modal .modal-banner').css('background-image', 'url(img/milestone_' + this.chapter + '.png)');
		this.modal.css('left', Story.chapterStartPoint(this.chapter)+this.content[this.chapter-1].position);
		this.modal.animate({opacity: 1}, 2000);
	},
	showThanks: function(callback) {
		$('#likes-modal #info').fadeOut(1000, function() {
			if(Likes[Story.current_chapter].limit_reached) {
				$('#likes-modal #thanks #message').hide();
				$('#likes-modal #thanks #congrats').fadeIn(1000);
			} else {
				$('#likes-modal #thanks #congrats').hide();
				$('#likes-modal #thanks #message').fadeIn(1000);
			}
			if(callback)
				callback();
		});
		$('#likes-modal #thanks').fadeIn(1000);
	},
	reset: function() {
		$('#likes-modal #info').show();
		$('#likes-modal #thanks').fadeOut();
		$('#likes-modal #thanks #message').hide();
		$('#likes-modal #thanks #congrats').hide();
		$('#likes-modal #thanks #congrats a#continue').attr('disabled', false);
	},
	hide: function() {
		this.modal.animate({opacity: 0}, 2000);
	}
}


/***********************
 * Scroll control object
 ***********************/
var Scroll = {
	preventScrolling: function() {
		// lock scroll position, but retain settings for later
		var scrollPosition = [
			self.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft,
			self.pageYOffset || document.documentElement.scrollTop  || document.body.scrollTop
		];
		var html = $('html'); // it would make more sense to apply this to body, but IE7 won't have that
		html.data('scroll-position', scrollPosition);
		html.data('previous-overflow', html.css('overflow'));
		html.css('overflow', 'hidden');
		window.scrollTo(scrollPosition[0], scrollPosition[1]);
	},
	enableScrolling: function() {
		// un-lock scroll position
		var html = $('html');
		var scrollPosition = html.data('scroll-position');
		html.css('overflow', 'visible');
		window.scrollTo(scrollPosition[0], scrollPosition[1]);
	},
	scroll: function() {
		window.scrollBy(50,0);
		scrollDelay = setTimeout('Story.scroll()',100); // scrolls every 100 milliseconds
	},
	stopScroll: function() {
    	clearTimeout(scrollDelay);
	}
}

/********************************
 * Flags object that controls all 
 * the flag modal functionality
 *******************************/
var Flags = {
	x: 0,
	/*********************************************
	 * The content array is set up based on number 
	 * of chapters and flags in each chapter.  We 
	 * access the content based on chapter/flag 
	 * (e.g. this.content[2][2] for content in Chapter 2, Flag 2)
	 **********************************************/
	content: [
		// Chapter 1
		[ 
			'Meet <a href="http://www.joinmyvillage.com" target="_blank">Join My Village</a>, a unique online initiative working through CARE to lift women and girls out of poverty in India and Malawi through education and community initiatives...to empower women and girls to strengthen themselves, their families, their communities&mdash;and the world.',
			'Education is a birthright for all children. But only 1 out of 3 girls graduates from primary school in developing countries, leaving them stuck in a <a href="http://joinmyvillage.com/what-is-jmv" target="_blank">cycle of poverty.</a>',
			'<a href="http://joinmyvillage.com/how-it-works" target="_blank">Our support model is a little different</a>. It involves action on your part. Each Facebook post you like and every click on our website releases $1 from General Mills and Merck to fund the important work of empowering girls through CARE.'
		],
		// Chapter 2
		[
			'In India, Join My Village supports an accelerated learning program, called <a href="http://joinmyvillage.com/project/accelerated-learning" target="_blank">Udaan</a>, targeting older girls who have not completed primary school. The program brings them up to a fifth-grade level in just 11 months&mdash;and 95% choose to continue their education.',
			'Join My Village is working in Malawi to build <a href="http://joinmyvillage.com/project/primary-school-support" target="_blank">new teacher housing</a> that will bring more female teachers to rural villages—bringing more mentors and reducing class size.'
		],
		// Chapter 3
		[
			'In India, Join My Village supports <a href="http://joinmyvillage.com/project/kgbv-school-support" target="_blank">KGBV schools—upper primary schools for girls</a> that help them prepare for secondary school while gaining important social skills including working in groups, problem solving, critical thinking, persistence in the face of difficulty and respect for others and themselves.',
			'Join My Village has provided more than 800 <a href="http://joinmyvillage.com/project/scholarships" target="_blank">secondary boarding school scholarships</a> in Malawi to help more girls get higher education.'
		],
		// Chapter 4
		[
			'In India, with help from Join My Village, secondary school girls have started a <a href="http://joinmyvillage.com/blog-post/a-bond-thicker-than-blood" target="_blank">leadership program called Kishori Samooh</a> to make a positive difference in their communities.',
			'In Malawi, Join My Village has provided <a href="http://www.joinmyvillage.com/blog-post/making-the-impossible-possible" target="_blank">mentoring to over 250 girls</a> in secondary schools to encourage them to continue their education.'
		],
		// Chapter 5
		[
			'<a href="http://joinmyvillage.com/project/maternal-health" target="_blank">Maternal mortality is a global tragedy</a>. Every day nearly 1,000 expectant mothers die; 98 percent of them in poor countries.',
			'India has the highest number of maternal deaths in the world. Join My Village supports <a href="http://joinmyvillage.com/blog-post/motherhood-is-to-be-cherished" target="_blank">maternal and newborn health programs</a> in 1,000 villages in Uttar Pradesh, helping women deliver and raise healthier families.'
		],
		// Chapter 6
		[
			'For every $1 invested in a woman, <a href="http://joinmyvillage.com/blog-post/the-power-of-being-a-vsla-member" target="_blank">she will put 80% towards her family’s health</a>, education and well-being.',
			'Join My Village has helped to create <a href="http://joinmyvillage.com/project/vsla" target="_blank">over 50 women-owned VSLAs</a> in Malawi, lending out over $60,000 to start small businesses.'
		]
	],
	init: function() {
		for(var i=1; i<=6; i++) {
			for(var j=1; j<=this.content[i-1].length; j++) {
				this.setupClick(i,j);
			}
		}
	},
	setupClick: function(chapter, index) {
		$('#chapter-' + chapter + ' #flag-' + chapter + index).click(function() {
			var chapter = $(this).parent().attr('id').substr(8,9);
			var flag_num = this.id.substr(6,7);
			Flags.x = $(this).position().left;
			if(chapter == 1 && flag_num == 2) {
				$('#jmv-modal .modal-content img').hide();
				$('#jmv-modal .modal-content #video').html('<iframe width="480" height="360" src="http://www.youtube.com/embed/xc3Ijmu-wZc" frameborder="0" allowfullscreen></iframe>');
				$('#jmv-modal .modal-content #video').show();
			} else {
				$('#jmv-modal .modal-content #video').hide();
				var img = $('#jmv-modal .modal-content img');
				img.attr('src', 'img/jmv_banners/c' + chapter + '_f' + flag_num + '.jpg');
				img.show();
			}
			$('#jmv-modal .modal-content p').html(Flags.content[chapter-1][flag_num-1]);
			//$('#jmv-modal').fadeIn('slow');
			$('#jmv-modal').modal({
				position: ['20%',],
				closeHTML: '<a class="modal-close"></a>',
				closeClass: 'modal-close'
			});
			var height = Number($('#jmv-modal').css('height').substr(0,3));
			$('#jmv-modal #border-left').css('height', height - 49);
			$(window).bind('scroll', function() {
				if (Maya.xPosition() > Flags.x) {
					$('#modal-overlay').fadeOut(500);
					$('#modal-container').fadeOut(500, function() {
						$.modal.close();
					});
				}
			});
		});
	},
}

/*****************************
 * Boxes object that controls 
 * box behaviors in Story
 *****************************/
var Boxes = {
	init: function() {
		this.bindScroll();
	},
	bindScroll: function() {
		$(window).bind('scroll', function() {
			// if the chapter is closed, then the user has already gone through this chapter, so we don't need to do this again and show the boxes.
			if(!Story.chapter_close_status[Story.current_chapter] && Story[Story.current_chapter].status == true) {
				// show boxes from the current chapter.
				Boxes.showBoxes(Story.current_chapter);
				// we want to show the boxes of all previous chapters as well
				//Boxes.showPreviousChapterBoxes(Story.current_chapter - 1);
			}
		});
	},
	show: function( chapter, box_num ) {
		var box = $('#chapter-' + chapter + ' #box-' + chapter + box_num);
		if(box.attr('enabled'))
			return;
		var p = box.css('bottom');
		box.css({bottom: '+=100px'});
		box.animate({bottom: p, opacity: 1}, 1000);
		box.attr('enabled', true);
	},
	xPosition: function ( box ) {
		return box.position().left;
	},
	yPosition: function ( box ) {
		return box.position().top;
	},
	showBoxes: function( chapter ) {
		var boxes = $('#chapter-' + chapter + ' .box').length;
		for(var i=1; i<=boxes; i++) {
			var box = $('#chapter-' + chapter + ' #box-' + chapter + i);
			if (Maya.xPosition() > this.xPosition( box ) - 450) {
				Boxes.show(chapter, i);
			}
		}
	},
	showPreviousChapterBoxes: function( chapter ) {
		for(var i=1; i<chapter; i++) {
			this.showBoxes(i);
		}
	}
}

/******************************
 * Maya object
 * Controls all Maya's behaviors
 * throughout the story
 ******************************/
var Maya = {
	bg_points: null,
	pause_animation: false,
	current_life_stage: 'child', // Maya starts life as a child
	lifeTransition: function( lifestage ) {
		var maya = $('#maya');
		var bg_pos = null;
		switch(lifestage) {
			case 'child':
				var bp_pos = -5;
				this.bg_points = ['-5px', '-72px', '-144px', '-216px','-286px'];
			break;
			case 'teen':
				bg_pos = 8;
				this.bg_points = ['0px', '-81px', '-162px', '-243px', '-323px'];
			break;
			case 'woman':
				bg_pos = -8;
				this.bg_points = ['-8px', '-93px', '-185px', '-279px', '-372px'];
			break;
			case 'pregnant':
				bg_pos = -5;
				this.bg_points = ['-5px', '-56px', '-109px'];
			break;
			case 'mother':
				bg_pos = -8;
				this.bg_points = ['-8px', '-89px', '-180px', '-273px', '-372px'];
			break;
			default:
				
			break;
		}
		if(this.current_life_stage != lifestage) {
			this.pause_animation = true;
			this.celebrate(bg_pos, lifestage);
		} else {
			this.setBg(bg_pos, lifestage);
		}
		this.current_life_stage = lifestage;
	},
	celebrate: function(bg_pos, lifestage) { // Boom.  Show some sparkly stars to celebrate a life transition.
		var stars = $('#maya #stars');
		// first fade out the old Maya, then fade in the new Maya with the stars
		$('#maya').fadeOut(300, function() {
			Maya.setBg(bg_pos, lifestage)
			$(this).fadeIn(300);
			//stars.css({bottom: '50px'});
			//stars.animate({opacity:1}, 1000).animate({opacity:0}, 1000);
			Maya.pause_animation = false;
		})
	},
	setBg: function(bg_pos, lifestage) {
		$('#maya').css('background-position', bg_pos + 'px');
		$('#maya').
			removeClass('maya-child').
			removeClass('maya-teen').
			removeClass('maya-woman').
			removeClass('maya-pregnant').
			removeClass('maya-mother').
			addClass('maya-' + lifestage);
	},
	animate: function() {
		$(window).bind('scroll', function() {
			if(Maya.pause_animation == false) {
				var yPos = $('#footer').position().top;
				$('#maya').css('bottom', 74-$(window).scrollTop() + 'px');
				var xPos = $(window).scrollLeft();
				// set up Maya to animate every 100 pixels
				var increment = 100;
				var x10Pos = Math.floor(xPos/increment)*increment;
				if (x10Pos/increment % 4 == 0 && Maya.bg_points.length >= 4) {
			    	$('#maya').css('background-position', Maya.bg_points[4]);
			   	}
			   	if (((x10Pos/increment) + 1) % 4 == 0) {
			    	$('#maya').css('background-position', Maya.bg_points[3]);
			   	}
			   	if ((x10Pos/increment + 2) % 4 == 0) {
			    	$('#maya').css('background-position', Maya.bg_points[2]);
			   	}
			   	if ((x10Pos/increment + 3) % 4 == 0) {
			    	$('#maya').css('background-position', Maya.bg_points[1]);
			   	}
			}
		})
	},
	enter: function( lifestage, celebrate ) {
		if(!celebrate)
			this.current_life_stage = lifestage; // don't celebrate when entering a chapter, unless specified
		this.lifeTransition(lifestage);
		$('#maya').fadeIn(1400, function() {
			Maya.animate();
		});
	},
	exit: function() {
		$('#maya').animate({left: '+500px'}, 2000);
	},
	xPosition: function() {
		return $('#maya').position().left;
	}
}

/*******************
 * Animations object
 * Controls animations
 * throughout story
 *******************/
var Animations = {
	water_position: null,
	chapter: null,
	animateCrops: function( chapter ) {
		$('#chapter-' + chapter + ' #crop-' + chapter + '1 img').animate({width:35,height:53}, 1000);
		$('#chapter-' + chapter + ' #crop-' + chapter + '2 img').delay(200).animate({width:40,height:61}, 1000);
		$('#chapter-' + chapter + ' #crop-' + chapter + '3 img').delay(1200).animate({width:55,height:84}, 1000);
		$('#chapter-' + chapter + ' #crop-' + chapter + '4 img').delay(800).animate({width:45,height:69}, 1000);
		$('#chapter-' + chapter + ' #crop-' + chapter + '5 img').delay(400).animate({width:50,height:76}, 1000);
	},
	animateWater: function() {
		var start = Animations.water_position;
		var end = start - 30;
		$('#chapter-' + Animations.chapter + ' #water-front-' + Animations.chapter + '1').
	      animate({opacity:0.9, left: start + 'px'},800,'linear').
	      animate({opacity:0.92, left: end + 'px'},800,'linear', Animations.animateWater);
	    $('#chapter-' + Animations.chapter + ' #water-back-' + Animations.chapter + '1').
	      animate({opacity:0.9, left: end + 'px'},800,'linear').
	      animate({opacity:0.92, left: start + 'px'},800,'linear');
	},
	animatePlane: function() {
		$('#plane-31').
			animate({bottom:'574px'}, 1400, 'linear').
			animate({bottom:'514px'}, 1400, 'linear', Animations.animatePlane)
	}
}
