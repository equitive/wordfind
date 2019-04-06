/**
* Wordfind.js 0.0.1
* (c) 2012 Bill, BunKat LLC.
* Wordfind is freely distributable under the MIT license.
* For all details and documentation:
*     http://github.com/bunkat/wordfind
*/

(function (document, $, wordfind) {
  'use strict';

  var bugout = new debugout();
  self.logFilename = 'log.txt';
  var listOfWords = []
  var wordsFound = 0
  var puzzleOngoing = false

  var wordTime
  var startTime = Date.now()

  /**
  * An example game using the puzzles created from wordfind.js. Click and drag
  * to highlight words.
  *
  * WordFindGame requires wordfind.js and jQuery.
  */

    /**
    * Draws the puzzle by inserting rows of buttons into el.
    *
    * @param {String} el: The jQuery element to write the puzzle to
    * @param {[[String]]} puzzle: The puzzle to draw
    */
    var drawPuzzle = function (el, puzzle) {
      var output = '';
      // for each row in the puzzle
      for (var i = 0, height = puzzle.length; i < height; i++) {
        // append a div to represent a row in the puzzle
        var row = puzzle[i];
        output += '<div>';
        // for each element in that row
        for (var j = 0, width = row.length; j < width; j++) {
            // append our button with the appropriate class
            output += '<button class="puzzleSquare" x="' + j + '" y="' + i + '">';
            output += row[j] || '&nbsp;';
            output += '</button>';
        }
        // close our div that represents a row
        output += '</div>';
      }

      $(el).html(output);
    };

    var getWords = function () {

      return $('input.word').toArray().map(wordEl => wordEl.value.toLowerCase()).filter(word => word);
    };

    /**
    * Given two points, ensure that they are adjacent and determine what
    * orientation the second point is relative to the first
    *
    * @param {int} x1: The x coordinate of the first point
    * @param {int} y1: The y coordinate of the first point
    * @param {int} x2: The x coordinate of the second point
    * @param {int} y2: The y coordinate of the second point
    */
    var calcOrientation = function (x1, y1, x2, y2) {

      for (var orientation in wordfind.orientations) {
        var nextFn = wordfind.orientations[orientation];
        var nextPos = nextFn(x1, y1, 1);

        if (nextPos.x === x2 && nextPos.y === y2) {
          return orientation;
        }
      }

      return null;
    };


  /**
  * Initializes the WordFindGame object.
  *
  * Creates a new word find game and draws the board and words.
  *
  * Returns the puzzle that was created.
  *
  * @param {String} puzzleEl: Selector to use when inserting the puzzle
  * @param {Options} options: WordFind options to use when creating the puzzle
  */
  var WordFindGame = function (puzzleEl, options) {

    // Class properties, game initial config:
    var wordList, puzzle;

    /**
    * Game play events.
    *
    * The following events handle the turns, word selection, word finding, and
    * game end.
    *
    */

    // Game state
    var startSquare, selectedSquares = [], curOrientation, curWord = '';

    /**
    * Event that handles mouse down on a new square. Initializes the game state
    * to the letter that was selected.
    *
    */
    var startTurn = function () {
      if(puzzleOngoing == true) {
      $(this).addClass('selected');
      startSquare = this;
      selectedSquares.push(this);
      curWord = $(this).text();
      }
    };
    
    var touchMove = function(e) {
      var xPos = e.originalEvent.touches[0].pageX;
      var yPos = e.originalEvent.touches[0].pageY;
      var targetElement = document.elementFromPoint(xPos, yPos);
      select(targetElement)
    };
    
    var mouseMove = function() { 
      select(this);
    };

    /**
    * Event that handles mouse over on a new square. Ensures that the new square
    * is adjacent to the previous square and the new square is along the path
    * of an actual word.
    *
    */
    var select = function (target) {
      // if the user hasn't started a word yet, just return
      if (!startSquare) {
        return;
      }

      // if the new square is actually the previous square, just return
      var lastSquare = selectedSquares[selectedSquares.length-1];
      if (lastSquare == target) {
        return;
      }

      // see if the user backed up and correct the selectedSquares state if
      // they did
      var backTo;
      for (var i = 0, len = selectedSquares.length; i < len; i++) {
        if (selectedSquares[i] == target) {
          backTo = i+1;
          break;
        }
      }

      while (backTo < selectedSquares.length) {
        $(selectedSquares[selectedSquares.length-1]).removeClass('selected');
        selectedSquares.splice(backTo,1);
        curWord = curWord.substr(0, curWord.length-1);
      }


      // see if this is just a new orientation from the first square
      // this is needed to make selecting diagonal words easier
      var newOrientation = calcOrientation(
          $(startSquare).attr('x')-0,
          $(startSquare).attr('y')-0,
          $(target).attr('x')-0,
          $(target).attr('y')-0
          );

      if (newOrientation) {
        selectedSquares = [startSquare];
        curWord = $(startSquare).text();
        if (lastSquare !== startSquare) {
          $(lastSquare).removeClass('selected');
          lastSquare = startSquare;
        }
        curOrientation = newOrientation;
      }

      // see if the move is along the same orientation as the last move
      var orientation = calcOrientation(
          $(lastSquare).attr('x')-0,
          $(lastSquare).attr('y')-0,
          $(target).attr('x')-0,
          $(target).attr('y')-0
          );

      // if the new square isn't along a valid orientation, just ignore it.
      // this makes selecting diagonal words less frustrating
      if (!orientation) {
        return;
      }

      // finally, if there was no previous orientation or this move is along
      // the same orientation as the last move then play the move
      if (!curOrientation || curOrientation === orientation) {
        curOrientation = orientation;
        playTurn(target);
      }
    };

    /**
    * Updates the game state when the previous selection was valid.
    *
    * @param {el} square: The jQuery element that was played
    */
    var playTurn = function (square) {

      // make sure we are still forming a valid word
      for (var i = 0, len = wordList.length; i < len; i++) {
        if (wordList[i].indexOf(curWord + $(square).text()) === 0) {
          $(square).addClass('selected');
          selectedSquares.push(square);
          curWord += $(square).text();
          break;
        }
      }
    };

    /**
    * Event that handles mouse up on a square. Checks to see if a valid word
    * was created and updates the class of the letters and word if it was. Then
    * resets the game state to start a new word.
    *
    */
    var endTurn = function () {
        // see if we formed a valid word
        var word_data = {}

        for (var i = 0, len = wordList.length; i < len; i++) {
          
          if (wordList[i] === curWord) {
            $('.selected').addClass('found');

            var url_string = window.location.href
            var url = new URL(url_string);
            var uid = url.searchParams.get("uid");
            var pid = url.searchParams.get("pid");

            word_data = {
              user: uid,
              puzzle: pid,
              time: wordTime,
              word: listOfWords[wordIndex],
              skipped: 0,
              timestamp: Date.now()
            };
      
            $.post("words.php", word_data);


            startTime = Date.now()


            wordList.splice(i,1);
            wordListCount = wordListCount - 1

            var index = listOfWords.indexOf(curWord);
            if (index !== -1) listOfWords.splice(index, 1);
            
            var twStatus = document.getElementById("totalWords");//.value//300;
            var tw = parseInt(twStatus.innerHTML)

            var twlStatus = document.getElementById("totalWordsLeft");//.value//300;
            var twl = parseInt(twlStatus.innerHTML)

            var wiStatus = document.getElementById("wordIndex");//.value//300;
            var wi = parseInt(wiStatus.innerHTML)

            $("#displayWord").append($("<li>").text(listOfWords[wi]));
            twl = twl - 1
            twlStatus.textContent = twl

            wordsFound = wordsFound + 1

            $('input.word[value="' + curWord + '"]').addClass('wordFound');
          }

          if (wordList.length === 0) {
            $('.puzzleSquare').addClass('complete');
          }
        }

        // reset the turn
        $('.selected').removeClass('selected');
        startSquare = null;
        selectedSquares = [];
        curWord = '';
        curOrientation = null;
    };

    jQuery(function($){
      $('#startClock').on('click', doCount);

      $('#skipWord').on('click', skipThatWord);


    });

    function skipThatWord(){
      var word_data = {}

      console.log("Yo yo hujfdtryj")
      // console.log(wordList)
      // console.log(listOfWords)
      // wordList = wordList.slice(1)
      console.log(wordList)
      console.log(wordIndex + "WORD INDEX")
      var url_string = window.location.href
      var url = new URL(url_string);
      var uid = url.searchParams.get("uid");
      var pid = url.searchParams.get("pid");

      var wiStatus = document.getElementById("wordIndex");//.value//300;
      var wi = parseInt(wiStatus.innerHTML)

      word_data = {
        user: uid,
        puzzle: pid,
        time: wordTime,
        word: listOfWords[wordIndex],
        skipped: 1,
        timestamp: Date.now()
      };

      $.post("words.php", word_data);

      console.log(listOfWords[wi])
      console.log(wordList[wi])

      

      startTime = Date.now()

      var index = wordList.indexOf(listOfWords[wordIndex]);
      if (index !== -1) wordList.splice(index, 1);


      // if(wi != wordIndex) {
        // wordIndex = wi
        // $("#displayWord").append($("<li>").text(listOfWords[wi]));
      // }

      // console.log( "hjg,mfndchjk.h,gmcfnx" + wordList[wordIndex])

      // var wiStatus = document.getElementById("wordIndex");//.value//300;
      // var wi = parseInt(wiStatus.innerHTML)
      // wi = wi + 1
      // wiStatus.textContent = wi;

      console.log("STIO")

      console.log(wordList)

    };


    // function skipWord() {
    //   console.log("Skipped this word")
    //   var input = document.getElementById("wordSkipCount");//.value//300;
    //   var wsc = parseInt(input.innerHTML)

    //   var wlcountinput = document.getElementById("wlCount");//.value//300;
    //   wordListCount = parseInt(wlcountinput.innerHTML) - 1
    //   wlcountinput.textContent = wordListCount;

    //   totalWords = totalWords - 1

    //   input.textContent = wsc+1;

        
    // }
    // function skipPuzzle() {
    //     console.log("Skipped this puzzle")

    //     var input = document.getElementById("puzzleSkipCount");//.value//300;
    //     var psc = parseInt(input.innerHTML)

    //     input.textContent = psc+1;
    // }
    // function doesNotExist() {
    //     console.log(" this word does not exist")

    //     var input = document.getElementById("doesNotExistCount");//.value//300;
    //     var wsc = parseInt(input.innerHTML)
    //     totalWords = totalWords - 1

    //     input.textContent = wsc+1;
    // }

    function startWordTimer() {
      // startTime = Date.now();

      var interval = setInterval(function() {
          var elapsedTime = Date.now() - startTime;
          // document.getElementById("timer").innerHTML = (elapsedTime / 1000).toFixed(3);
          wordTime = (elapsedTime / 1000).toFixed(3);

      }, 100);

    }

    function doCount(){
      $("#skipWord").attr("disabled", false);
      $("#skipPuzzle").attr("disabled", false);

      console.log(document.getElementById("count"))
        var input = document.getElementById("count");//.value//300;
        var counter = input.innerHTML

        // var puzzleOngoing = true
        puzzleOngoing = true


        var url_string = window.location.href
        var url = new URL(url_string);
        var uid = url.searchParams.get("uid");
        var pid = url.searchParams.get("pid");
        // $("#displayWord").append($("<li>").text(wordList[wordIndex]));

        if(parseInt(pid) == 1) {
          listOfWords = [
            'dig',
            'grind',
            'try'
          ]
        } else if (parseInt(pid) == 2) {
          listOfWords = [
            'persist',
            "stick",
            "dedicate",
            "achieve",
            "hustle"
          ]
        } else if (parseInt(pid) == 3) {
          listOfWords = [
            'commit',
            'sweat',
            'work',
            'endure',
            'proceed',
            'devote',
            'determined'
          ]
        } else if (parseInt(pid) == 4) {
          listOfWords = [
            'strive', 
            'unwavering',
            'pursue',
            'diligent', 
            'driven',
            'decided', 
            'discover', 
            'fixed',
            'focus' 
          ]
        } else if (parseInt(pid) == 5) {
          listOfWords = [
            'adamant', 
            'continue',
            'relentless', 
            'effort', 
            'encourage', 
            'thorough',
            'resolve', 
            'set',
            'studious',
            'tireless', 
            'steady' 
          ]
        }
        console.log(uid);
        console.log(pid);
        console.log("Let s gooooo")

        var data = {}
        // console.log(counter.innerHTML)
        if( puzzleOngoing == true ) {
          startWordTimer()

          var check = setInterval(function() {

              console.log("JUJUJUJUJUJ")
              console.log(wordList)
              console.log(counter)


              var wlcountinput = document.getElementById("wlCount");//.value//300;
              var wlc = parseInt(wlcountinput.innerHTML)
              console.log("word list count " + totalWords)//wordListCount)
              wlcountinput.textContent = totalWords//wordListCount;
              
              var puzzleSkippedStatus = document.getElementById("puzzleSkipCount");//.value//300;
              var pss = puzzleSkippedStatus.innerHTML
              console.log("Do count" + pss)


              var wordSkippedStatus = document.getElementById("wordSkipCount");//.value//300;
              var wsc = parseInt(wordSkippedStatus.innerHTML)

              var wiStatus = document.getElementById("wordIndex");//.value//300;
              var wi = parseInt(wiStatus.innerHTML)

              if(wi != wordIndex) {
                wordIndex = wi
                $("#displayWord").append($("<li>").text(listOfWords[wi]));
                startTime = Date.now()
              }

              // var doesNotExistStatus = document.getElementById("doesNotExistCount");//.value//300;
              // var dnec = parseInt(doesNotExistStatus.innerHTML)

              var twlStatus = document.getElementById("totalWordsLeft");//.value//300;
              var twl = parseInt(twlStatus.innerHTML)

              console.log("WORD FOUNDDDDDDD " + wordsFound)
              
              if( parseInt(pss) > 0) {
                clearInterval(check);
                document.getElementById('id03').style.display='block'

                  data = {
                      user: uid,
                      puzzle: pid,
                      time: counter,
                      present_words_left: wordList.length,
                      total_words_left: twl,
                      words_in_puzzle: totalWordsStart,
                      puzzle_skipped: pss,
                      words_skipped: wsc,
                      words_found: wordsFound,

                      timestamp: Date.now()
                  };
          
                  $.post("experiment.php", data);
                  puzzleOngoing = false
              }
              else if(twl === 0) {

              // else if(wordList.length === 0) {
                clearInterval(check);
                document.getElementById('id01').style.display='block'

                  data = {
                    user: uid,
                    puzzle: pid,
                    time: counter,
                    present_words_left: wordList.length,
                    total_words_left: twl,
                    words_in_puzzle: totalWordsStart,
                    puzzle_skipped: pss,
                    words_skipped: wsc,
                    words_found: wordsFound,

                    timestamp: Date.now()
                  };
          
                  $.post("experiment.php", data);
                  puzzleOngoing = false

              } else {
                  counter--;
                  wordTime = wordTime + 1
                  if (counter >= 0) {
                    document.getElementById("count").textContent=counter;
                  }
                  if (counter === 0) {
                      clearInterval(check);
                      document.getElementById('id02').style.display='block'
                      
                      data = {
                        user: uid,
                        puzzle: pid,
                        time: counter,
                        present_words_left: wordList.length,
                        total_words_left: twl,
                        words_in_puzzle: totalWordsStart,
                        puzzle_skipped: pss,
                        words_skipped: wsc,
                        words_found: wordsFound,

                        timestamp: Date.now()
                      };
              
                      $.post("experiment.php", data);
                      puzzleOngoing = false
                  }
              }
          }, 1000);
        } else {
          clearInterval(counter);
        }
    }

    function WriteFile() {
      var fh = fopen("c:\\MyFile.txt", 3); // Open the file for writing

      if(fh!=-1) // If the file has been successfully opened
      {
          var str = "Some text goes here...";
          fwrite(fh, str); // Write the string to a file
          fclose(fh); // Close the file 
      }
    }

    /* Constructor START */
    $('input.word').removeClass('wordFound');

    // Class properties, game initial config:
    wordList = getWords()//.sort();

    puzzle = wordfind.newPuzzleLax(wordList, options);
    var wordListCount = wordList.length
    var totalWordsInput = document.getElementById("totalWords");//.value//300;
    var totalWords = parseInt(totalWordsInput.innerHTML)
    var totalWordsStart = parseInt(totalWordsInput.innerHTML)
    var wordIndex

    // Draw all of the words
    drawPuzzle(puzzleEl, puzzle);

    // attach events to the buttons
    // optimistically add events for windows 8 touch
    if (window.navigator.msPointerEnabled) {
      $('.puzzleSquare').on('MSPointerDown', startTurn);
      $('.puzzleSquare').on('MSPointerOver', select);
      $('.puzzleSquare').on('MSPointerUp', endTurn);
    } else {
      $('.puzzleSquare').mousedown(startTurn);
      $('.puzzleSquare').mouseenter(mouseMove);
      $('.puzzleSquare').mouseup(endTurn);
      $('.puzzleSquare').on("touchstart", startTurn);
      $('.puzzleSquare').on("touchmove", touchMove);
      $('.puzzleSquare').on("touchend", endTurn);
    }

    /**
    * Solves an existing puzzle.
    *
    * @param {[[String]]} puzzle: The puzzle to solve
    */
    this.solve = function() {
      var solution = wordfind.solve(puzzle, wordList).found;

      for( var i = 0, len = solution.length; i < len; i++) {
        var word = solution[i].word,
            orientation = solution[i].orientation,
            x = solution[i].x,
            y = solution[i].y,
            next = wordfind.orientations[orientation];

        var wordEl = $('input.word[value="' + word + '"]');
        if (!wordEl.hasClass('wordFound')) {
          for (var j = 0, size = word.length; j < size; j++) {
            var nextPos = next(x, y, j);
            $('[x="' + nextPos.x + '"][y="' + nextPos.y + '"]').addClass('solved');
          }

          wordEl.addClass('wordFound');
        }
      }
    };
  };

  WordFindGame.emptySquaresCount = function () {
    var allSquares = $('.puzzleSquare').toArray();
    return allSquares.length - allSquares.filter(b => b.textContent.trim()).length;
  };

  // Static method
  WordFindGame.insertWordBefore = function (el, word) {
    $('<li><input class="word" value="' + (word || '') + '"></li>').insertBefore(el);
  };


  /**
  * Allow game to be used within the browser
  */
  window.WordFindGame = WordFindGame;

}(document, jQuery, wordfind));
