import {  Component, ElementRef, HostListener, OnInit, QueryList, ViewChildren } from '@angular/core';
import { PLAYERS, SHUFFLED } from '../app.constants';
import Keyboard from 'simple-keyboard';
import 'simple-keyboard/build/css/index.css';
import { MatDialog } from '@angular/material/dialog';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
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
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  @ViewChildren('tryContainer') tryContainers!: QueryList<ElementRef>;
  player: any;
  playerName: string;
  wordLength: number;
  wordLengthArray = [];
  readonly PLAYERS = PLAYERS;
  readonly SHUFFLED = SHUFFLED;
  PLAYERS_NAMES = [];
  dialogState = 'close';
  value = "";
  keyboard: Keyboard;
  tryNumber = 0;
  date = new Date();

  won = false;
  readonly tries: Try[] = [];
  curLetterIndex = 0;
  readonly curLetterStates: {[key: string]: LetterState} = {};
  targetWordLetterCounts: {[letter: string]: number} = {};
  numSubmittedTries = 0;
  isLetter: boolean;

  constructor(
    public dialog: MatDialog,
    private _snackBar: MatSnackBar,
  ) {
    this.player = this.PLAYERS[this.SHUFFLED[((this.date.getMonth()) * 30) + this.date.getDate()]];
    this.playerName = this.player.FIELD3;
    this.PLAYERS.forEach(player => {
      this.PLAYERS_NAMES.push(player.FIELD3)
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

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this.keyboard = new Keyboard({
      useButtonTag: true,
      onChange: input => this.onChange(input),
      onKeyPress: button => this.onKeyPress(button)
    });
    this.keyboard.setOptions({
      layout: {
        default: [
          "q w e r t y u i o p {delete}",
          "a s d f g h j k l",
          "z x c v b n m {enter}",
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

  getRandomPlayer() {
    this.playerName = this.PLAYERS[Math.floor(Math.random() * this.PLAYERS.length)].FIELD3;
  }

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
      }
      else if (key === 'Backspace' || key === '{delete}') {
        // Don't delete previous try.
        if (this.curLetterIndex > this.numSubmittedTries * this.wordLength) {
          this.curLetterIndex--;
          this.setLetter('');
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
    }
  }

  allowOnlyAlphabet(letter: string) {
    if (letter === 'Backspace' || letter === 'Enter' || letter === '{enter}' || letter === '{delete}') {
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
    const states: LetterState[] = [];

    // Check if user has typed all the letters.
    if (curTry.letters.some(letter => letter.text === '')) {
      this.openDialog('Not enough letters', 'Ok', 3000);
      return;
    } else if (!this.PLAYERS_NAMES.includes(wordFromCurTry)) {
      this.openDialog('Not a Serie A player', 'Ok', 3000);
    } else {
      for (let i = 0; i < this.wordLength; i++) {
        const expected = this.playerName[i];
        const curLetter = curTry.letters[i];
        const got = curLetter.text.toUpperCase();
        let state = LetterState.WRONG;
  
        if (expected === got && targetWordLetterCounts[got] > 0) {
          targetWordLetterCounts[expected]--;
          state = LetterState.FULL_MATCH;
        } else if (this.playerName.includes(got) && targetWordLetterCounts[got] > 0) {
          targetWordLetterCounts[got]--
          state = LetterState.PARTIAL_MATCH;
        }
        states.push(state);
        curLetter.state = state;
        this.getLetterClass(curLetter);
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
    // 🟩🟨⬜
    // Copy results into clipboard.
    let clipboardContent = `Worball n. ${((this.date.getMonth()) * 30) + this.date.getDate()}
    `;
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

}
