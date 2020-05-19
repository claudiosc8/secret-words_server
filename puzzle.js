const Words = require('./models/Words.js')

let puzzles = [];


const checkPuzzle = async (room) => {

  if(!room) return
  room = room.trim().toLowerCase();
  
  const existingPuzzle = getPuzzle(room)
  if(existingPuzzle) return {puzzle: existingPuzzle}

  const puzzle = await newPuzzle(room)  
  
  return puzzle

}

const newGame = async (room) => {
  removePuzzle(room);
  const puzzle = await newPuzzle(room)  
  return puzzle
}

const newPuzzle = async (room) => {
  
  room = room.trim().toLowerCase();

  const words = await Words.aggregate([{$sample: {size: 25}}])
  const wordsArray = words.map(e => { return { value:e.name, label:{en: e.name, it: e.it, es: e.es} } })

  const key = generateKey();

  const puzzle = {
    room: room, 
    words: wordsArray, 
    key: key.value, 
    currentTurn: key.starts, 
    points: {red: key.starts === 'red' ? 9 : 8, blue: key.starts === 'blue' ? 9 : 8},
    messages: [],
  }

  puzzles.push(puzzle);

  return puzzle ;

}

const newMessage = (room, message, type) => {

  const puzzle = getPuzzle(room)

  if(puzzle) {
    const text = {text: message, time: Date.now(), type: type}
    puzzle.messages.push(text)
    return puzzle
  }
  
}

const getPuzzle = (room) => puzzles.find((puzzle) => puzzle.room === room.trim().toLowerCase() )

const removePuzzle = (room) => {
  const index = puzzles.findIndex((puzzle) => puzzle.room === room.trim().toLowerCase());
  if(index !== -1) return puzzles.splice(index, 1)[0];
}

const getAllPuzzles = () => puzzles

const generateKey = () => {

  const whoStarts = Math.random() < 0.5 ? 'red' : 'blue';
  const neutral = Array(7).fill('neutral');
  const red = Array(whoStarts === 'red' ? 9 : 8).fill('red');
  const blue = Array(whoStarts === 'blue' ? 9 : 8).fill('blue');
  const black = ['black']

  const array = [...neutral, ...red, ...blue, ...black].sort(() => Math.random() - 0.5)

  return {value: array, starts: whoStarts}

}

const otherTeam = (team) => {
  return team === 'red' ? 'blue' : 'red'
}

const endTurn = room => {
  const puzzle = getPuzzle(room)

  if(puzzle) {
    puzzle.currentTurn = otherTeam(puzzle.currentTurn);
    return puzzle
  }
  
}

const selectWord = (room, word, name) => {

  const puzzle = getPuzzle(room)

  if(puzzle) {
    puzzle.selected = word
    newMessage(room, `${name} selected the word '${word.toUpperCase()}'`, 'game')
    return puzzle
  } 

}

const guessWord = (room, word, name) => {

  const puzzle = getPuzzle(room)

  if(puzzle) {

      const index = puzzle.words.findIndex((e) => e.value === word);
      const color = puzzle.key[index]
      puzzle.words[index].color = color;

      newMessage(room, `${name} confirmed '${word.toUpperCase()}'`, 'game')

      switch(color) {
        case 'black':
          endTurn(room)
          puzzle.winner = puzzle.currentTurn;
          puzzle.black = true;
          break;
        case otherTeam(puzzle.currentTurn):
          endTurn(room)
          puzzle.points[puzzle.currentTurn] -= 1;
          newMessage(room, `Wrong! '${word.toUpperCase()}' is for the ${color} team`, 'game')
          break;
        case 'neutral':
          endTurn(room)
          newMessage(room, `Wrong! '${word.toUpperCase()}' is a neutral word`, 'game')
          break;
        default:
          puzzle.points[puzzle.currentTurn] -= 1;
          newMessage(room, `Correct! '${word.toUpperCase()}' is for the ${color} team`, 'game')
      }

      if(puzzle.points[puzzle.currentTurn] === 0) {
        puzzle.winner = puzzle.currentTurn
      }
      
      puzzle.selected = '';

      return puzzle
  }
  

}


module.exports = { checkPuzzle, newPuzzle, getPuzzle, getAllPuzzles, removePuzzle, endTurn, guessWord, newGame, newMessage, selectWord};