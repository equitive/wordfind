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
      $(this).addClass('selected');
      startSquare = this;
      selectedSquares.push(this);
      curWord = $(this).text();
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
      for (var i = 0, len = wordList.length; i < len; i++) {
        
        if (wordList[i] === curWord) {
          $('.selected').addClass('found');
          wordList.splice(i,1);
          wordListCount = wordListCount - 1
          totalWords = totalWords - 1
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
    });

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

    function doCount(){
      console.log(document.getElementById("count"))
        var input = document.getElementById("count");//.value//300;
        var counter = input.innerHTML

        var puzzleOngoing = true
        // var wlcountinput = document.getElementById("totalWordsLeft");//document.getElementById("wlCount");//.value//300;
        // var wlc = parseInt(wlcountinput.innerHTML)

        // console.log("word list count " + wordListCount)
        // wlcountinput.textContent = totalWords//wordListCount;
        // var wlc = parseInt(input.innerHTML)
        // wordListCount


        // var pInput = document.getElementById("puzzleID");//.value//300;
        // var pid = input.innerHTML
        
        // var uInput = document.getElementById("userID");//.value//300;
        // var uid = input.innerHTML

        // console.log(uid)
        // console.log(pid)

        var url_string = window.location.href
        var url = new URL(url_string);
        var uid = url.searchParams.get("uid");
        var pid = url.searchParams.get("pid");

        console.log(uid);
        console.log(pid);
        console.log("Let s gooooo")

        var data = {}
        // console.log(counter.innerHTML)
        if( puzzleOngoing == true ) {
          setInterval(function() {
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


              var doesNotExistStatus = document.getElementById("doesNotExistCount");//.value//300;
              var dnec = parseInt(doesNotExistStatus.innerHTML)

              var twlStatus = document.getElementById("totalWordsLeft");//.value//300;
              var twl = parseInt(twlStatus.innerHTML)
              
              if( parseInt(pss) > 0) {
                clearInterval(counter);
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
                      does_not_exist: dnec,

                      timestamp: Date.now()
                  };
          
                  $.post("experiment.php", data);
                  puzzleOngoing = false
              }
              else if(twl === 0) {

              // else if(wordList.length === 0) {
                clearInterval(counter);
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
                    does_not_exist: dnec,

                    timestamp: Date.now()
                  };
          
                  $.post("experiment.php", data);
                  puzzleOngoing = false

              } else {
                  counter--;
                  if (counter >= 0) {
                    document.getElementById("count").textContent=counter;
                  }
                  if (counter === 0) {
                      clearInterval(counter);
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
                        does_not_exist: dnec,
    
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
    wordList = getWords().sort();
    puzzle = wordfind.newPuzzleLax(wordList, options);
    var wordListCount = wordList.length
    var totalWordsInput = document.getElementById("totalWords");//.value//300;
    var totalWords = parseInt(totalWordsInput.innerHTML)
    var totalWordsStart = parseInt(totalWordsInput.innerHTML)

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
