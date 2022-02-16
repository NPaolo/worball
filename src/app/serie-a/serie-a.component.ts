import {  Component, ElementRef, HostListener, OnInit, QueryList, ViewChildren, ViewEncapsulation } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import Keyboard from 'simple-keyboard';
import { ITALY_PLAYERS, SHUFFLED } from '../app.constants';
import { DialogComponent } from '../dialog/dialog.component';

const NUM_TRIES = 6;

const LETTERS = (() => {
  // letter -> true. Easier to check.
  const ret: {[key: string]: boolean} = {};
  for (let charCode = 97; charCode < 97 + 26; charCode++) {
    ret[String.fromCharCode(charCode)] = true;
  }
  return ret;
})();

interface Try {
  letters: Letter[];
}

interface Letter {
  text: string;
  state: LetterState;
}

enum LetterState {
  WRONG, PARTIAL_MATCH, FULL_MATCH, PENDING,
}

@Component({
  selector: 'app-serie-a',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './serie-a.component.html',
  styleUrls: ['./serie-a.component.scss']
})
export class SerieAComponent {
  @ViewChildren('tryContainer') tryContainers!: QueryList<ElementRef>;
  player: any;
  playerName: string;
  wordLength: number;
  wordLengthArray = [];
  ITALY_PLAYERS = ITALY_PLAYERS;
  SHUFFLED = SHUFFLED;
  PLAYERS_NAMES = [];
  dialogState = 'close';
  value = "";
  keyboard: Keyboard;
  tryNumber = 0;
  date = new Date();

  won = false;
  tries: Try[] = [];
  curLetterIndex = 0;
  secondIndex = 0;
  readonly curLetterStates: {[key: string]: LetterState} = {};
  targetWordLetterCounts: {[letter: string]: number} = {};
  tryWordLetterCounts: {[letter: string]: number} = {};
  numSubmittedTries = 0;
  isLetter: boolean;
  league = 'Serie A';

  constructor(
    public dialog: MatDialog,
    private _snackBar: MatSnackBar,
    private router: Router
  ) {
    }

  ngOnInit(): void {
    this.resetContent();
    this.initContent();
    console.log(this.tries)
  }

  ngAfterViewInit() {
    this.keyboard = new Keyboard({
      onChange: input => this.onChange(input),
      onKeyPress: button => this.onKeyPress(button)
    });
    this.keyboard.setOptions({
      useButtonTag: true,
      layout: {
        default: [
          "q w e r t y u i o p",
          "a s d f g h j k l",
          "{enter} z x c v b n m {delete}",
        ],
      },
    });
  }

  onChange = (input: string) => {
    this.value = input;
  };

  onKeyPress = (button: string) => {
    this.handleClickKey(button);
  };

  onInputChange = (event: any) => {
    this.keyboard.setInput(event.target.value);
  };

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    this.handleClickKey(event.key);
  }

  handleClickKey(key: string) {
    // Don't process key down when user has won the game.
    if (this.won) {
      return;
    }

    this.allowOnlyAlphabet(key);
    if (this.isLetter) {
      if (this.curLetterIndex < (this.numSubmittedTries + 1) * this.wordLength && key !== 'Enter' && key !== '{enter}' && key !== 'Backspace' && key !== '{delete}') {
        this.setLetter(key);
        this.curLetterIndex++;
        this.secondIndex++;
      }
      else if (key === 'Backspace' || key === '{delete}') {
        if (this.dialogState === 'close') {
          if (this.curLetterIndex > this.numSubmittedTries * this.wordLength) {
            this.updateTryWordLetterCounts('')
            this.curLetterIndex--;
            this.secondIndex--;
            this.setLetter('');
          }
        }
      }
      else if ((key === 'Enter' || key === '{enter}') && this.dialogState === 'close') {
        this.checkCurrentTry();
      }
    }
  }

  setLetter(letter: string) {
    if (this.dialogState === 'close') {
      const tryIndex = Math.floor(this.curLetterIndex / this.wordLength);
      const letterIndex = this.curLetterIndex - tryIndex * this.wordLength;
      this.tries[tryIndex].letters[letterIndex].text = letter;
      if (letter !== '') {
        const count = this.tryWordLetterCounts[letter];
        if (count == null) {
          this.tryWordLetterCounts[letter] = 0;
        }
        this.tryWordLetterCounts[letter]++;
      }
    }
  }

  updateTryWordLetterCounts(letter: string) {
    const curTry = this.tries[this.numSubmittedTries];
    const wordFromCurTry = curTry.letters.map(letter => letter.text).join('').toUpperCase();
    let secondIndex = Math.floor(this.secondIndex - 1);
    if (letter === '') {
      if (this.tryWordLetterCounts[wordFromCurTry[secondIndex].toLowerCase()] > 0) {
        this.tryWordLetterCounts[wordFromCurTry[secondIndex].toLowerCase()]--;
      }
    } else {
      const count = this.tryWordLetterCounts[letter];
      if (count == null) {
        this.tryWordLetterCounts[letter] = 0;
      }
      this.tryWordLetterCounts[letter]++;
    }
  }

  allowOnlyAlphabet(letter: string) {
    if (letter === 'Backspace' || letter === 'Enter') {
      this.isLetter = true;
    } else {
      for (let i = 0; i < this.keyboard.options.layout.default.length; i++) {
        let letterLowerCase = letter.toLowerCase();
        if (this.keyboard.options.layout.default[i].includes(letterLowerCase)) {
          this.isLetter = true;
          break;
        } else {
          this.isLetter = false;
        }
      }
    }
  }

  async checkCurrentTry() {
    const curTry = this.tries[this.numSubmittedTries];
    const wordFromCurTry = curTry.letters.map(letter => letter.text).join('').toUpperCase();
    const targetWordLetterCounts = {...this.targetWordLetterCounts};
    const tryWordLetterCounts = {...this.tryWordLetterCounts};
    const states: LetterState[] = [];

    // Check if user has typed all the letters.
    if (curTry.letters.some(letter => letter.text === '')) {
      this.openDialog('Not enough letters', 'Ok', 3000);
      return;
    } else if (!this.PLAYERS_NAMES.includes(wordFromCurTry)) {
      this.openDialog(`Not a ${this.league} player`, 'Ok', 3000);
    } else {
      this.secondIndex = 0;
      for (let i = 0; i < this.wordLength; i++) {
        const expected = this.playerName[i];
        const curLetter = curTry.letters[i];
        const got = curLetter.text.toUpperCase();
        let state = LetterState.WRONG;
  
        if (expected === got && targetWordLetterCounts[got] > 0) {
          targetWordLetterCounts[expected]--;
          tryWordLetterCounts[got]--;
          state = LetterState.FULL_MATCH;
        } else if (this.playerName.includes(got) && targetWordLetterCounts[got] > 0) {
          if (tryWordLetterCounts[got.toLowerCase()] > targetWordLetterCounts[got]) {
            tryWordLetterCounts[got.toLowerCase()]--;
          } else {
            targetWordLetterCounts[got]--;
            state = LetterState.PARTIAL_MATCH;
          }
        }
        states.push(state);
        curLetter.state = state;
        this.getLetterClass(curLetter);
        this.tryWordLetterCounts = {};
      }
  
      // Get the current try.
      const tryContainer =
          this.tryContainers.get(this.numSubmittedTries)?.nativeElement as
          HTMLElement;
      // Get the letter elements.
      const letterEles = tryContainer.querySelectorAll('.letter-container');
      for (let i = 0; i < letterEles.length; i++) {
        // "Fold" the letter, apply the result (and update the style), then unfold
        // it.
        const curLetterEle = letterEles[i];
        curLetterEle.classList.add('fold');
        // Wait for the fold animation to finish.
        await this.wait(180);
        // Update state. This will also update styles.
        curTry.letters[i].state = states[i];
        // Unfold.
        curLetterEle.classList.remove('fold');
        await this.wait(180);
      }
  
      // Save to keyboard key states.
      //
      // Do this after the current try has been submitted and the animation above
      // is done.
      for (let i = 0; i < this.wordLength; i++) {
        const curLetter = curTry.letters[i];
        const got = curLetter.text.toLowerCase();
        const curStoredState = this.curLetterStates[got];
        const targetState = states[i];
        // This allows override state with better result.
        //
        // For example, if "A" was partial match in previous try, and becomes full
        // match in the current try, we update the key state to the full match
        // (because its enum value is larger).
        if (curStoredState == null || targetState > curStoredState) {
          this.curLetterStates[got] = targetState;
        }
      }
  
      this.numSubmittedTries++;
  
      // Check if all letters in the current try are correct.
      if (states.every(state => state === LetterState.FULL_MATCH)) {
        this.openDialog('You won!', 'Share', 50000);
        this.won = true;
        return;
      } else{
        this.tryNumber++;
        if (this.tryNumber === 6) {
          this.openDialog(`You lost! The player is ${this.playerName}`, 'Ok', 50000 )
        }
      }
    }
  }

  openDialog(message: string, action: string, duration: number) {
    if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
      this.openSnackBar(message, action, duration);
    } else {
      this.dialogState = 'open';
      const dialogRef = this.dialog.open(DialogComponent,
        {
          data: {
            message
          }
        });
        dialogRef.afterClosed().subscribe(() => {
          this.dialogState = 'close';
          if (message === 'You won!') {
            this.handleClickShare();
          }
        });
    }
  }
  

  private async wait(ms: number) {
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, ms);
    })
  }

  getLetterClass(letter) {
    if (letter.text.length > 0) {
      switch (letter.state) {
        case 0:
          return 'wrong';
        case 1:
          return 'partially-wrong';
        case 2:
          return 'correct';
      }
    }
  }

  handleClickShare() {
    let clipboardContent = ``;
    clipboardContent += `Worball ${this.league} n.${((this.date.getMonth()) * 30) + this.date.getDate()} \n \n`;
    for (let i = 0; i < this.numSubmittedTries; i++) {
      for (let j = 0; j < this.wordLength; j++) {
        const letter = this.tries[i].letters[j];
        switch (letter.state) {
          case LetterState.FULL_MATCH:
            clipboardContent += '🟩';
            break;
          case LetterState.PARTIAL_MATCH:
            clipboardContent += '🟨';
            break;
          case LetterState.WRONG:
            clipboardContent += '⬜';
            break;
          default:
            break;
        }
      }
      clipboardContent += '\n';
    }
    clipboardContent += '\n https://worball.netlify.app'
    navigator.clipboard.writeText(clipboardContent);
    this.openSnackBar('Result copied in your clipboard!', 'OK', 4000);
  }

  openSnackBar(message: string, action: string, duration: number) {
    let snackBarRef = this._snackBar.open(message, action, {
      duration,
    });

    if (message === 'You won!') {
      snackBarRef.onAction().subscribe(() => {
        this.handleClickShare()
      })
    }
  }

  setleague(league: string) {
    this.league = league;
    this.won = false;
    this.resetContent();
    this.initContent();
  }

  resetContent() {
    this.tries = [];
    this.curLetterIndex = 0;
    this.secondIndex = 0;
    this.numSubmittedTries = 0;
    this.tryNumber = 0;
    this.targetWordLetterCounts = {};
    this.tryWordLetterCounts = {};
    this.ITALY_PLAYERS = ITALY_PLAYERS.map(a => ({...a}));
    this.PLAYERS_NAMES = [];
  }

  initContent() {
    this.player = this.ITALY_PLAYERS[this.SHUFFLED[((this.date.getMonth()) * 30) + this.date.getDate()]];
    this.playerName = this.player.second_name;
    this.ITALY_PLAYERS.forEach(player => {
      this.PLAYERS_NAMES.push(player.second_name)
    });

    this.wordLengthArray = this.playerName.split('');
    this.wordLength = this.wordLengthArray.length;
    for (let i = 0; i < NUM_TRIES; i++) {
      const letters: Letter[] = [];
      for (let j = 0; j < this.wordLength; j++) {
        letters.push({text: '', state: LetterState.PENDING});
      }
      this.tries.push({letters});
    }

    // Generate letter counts for target word.
    for (const letter of this.playerName) {
      const count = this.targetWordLetterCounts[letter];
      if (count == null) {
        this.targetWordLetterCounts[letter] = 0;
      }
      this.targetWordLetterCounts[letter]++;
    }
  }
}
