import type { NextPage } from 'next'
import { Col, Row, Input, Typography, Button, Space } from 'antd'
import { useEffect, useState } from 'react'
import styles from '../styles/Home.module.css'

const { Title } = Typography

enum SquareType {
  Bomb = 'bomb-square',
  Number = 'number-square'
}

interface ISquare {
  type: SquareType
  value: string | null
  hidden: boolean
}

const checkForBombs = (row: number, col: number, board: ISquare[][], boardSize: number) => {
  const newBoard = [...board]

  if (!newBoard[row][col]) return true

  let bombCount = 0

  // check top left
  if (row - 1 >= 0 && col - 1 >= 0) {
    if (newBoard[row - 1][col - 1].type === SquareType.Bomb) {
      bombCount++
    }
  }

  // check top
  if (row - 1 >= 0) {
    if (newBoard[row - 1][col].type === SquareType.Bomb) {
      bombCount++
    }
  }

  // check top right
  if (row - 1 >= 0 && col + 1 < boardSize) {
    if (newBoard[row - 1][col + 1].type === SquareType.Bomb) {
      bombCount++
    }
  }

  // check left
  if (col - 1 >= 0) {
    if (newBoard[row][col - 1].type === SquareType.Bomb) {
      bombCount++
    }
  }

  // check right
  if (col + 1 < boardSize) {
    if (newBoard[row][col + 1].type === SquareType.Bomb) {
      bombCount++
    }
  }

  // check bottom left
  if (row + 1 < boardSize && col - 1 >= 0) {
    if (newBoard[row + 1][col - 1].type === SquareType.Bomb) {
      bombCount++
    }
  }

  // check bottom
  if (row + 1 < boardSize) {
    if (newBoard[row + 1][col].type === SquareType.Bomb) {
      bombCount++
    }
  }

  // check bottom right
  if (row + 1 < boardSize && col + 1 < boardSize) {
    if (newBoard[row + 1][col + 1].type === SquareType.Bomb) {
      bombCount++
    }
  }

  return bombCount
}

const MineSweeper: NextPage = () => {
  const [board, setBoard] = useState<ISquare[][]>([])
  const [boardSize, setBoardSize] = useState<number>(15)
  const [lastClicked, setLastClicked] = useState<any>([])
  const [bombsAdded, setBombsAdded] = useState<boolean>(false)

  const buildBoard = () => {
    const newBoard = []

    for (let i = 0; i < boardSize; i++) {
      const row = []

      for (let j = 0; j < boardSize; j++) {
        row.push({
          type: SquareType.Number,
          hidden: true,
          value: null
        })
      }

      newBoard.push(row)
    }

    setBoard(newBoard)
  }

  const showAllCells = () => {
    const newBoard = [...board]

    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        newBoard[i][j].hidden = false
      }
    }

    setBoard(newBoard)
  }

  // randomly add bombs to the board
  // but not on the first click
  const addBombs = () => {
    const newBoard = [...board]

    for (let i = 0; i < boardSize; i++) {
      const randomRow = Math.floor(Math.random() * boardSize)

      const randomCol = Math.floor(Math.random() * boardSize)

      if (!newBoard[randomRow]) {
        continue
      }
      //   if (newBoard[randomRow][randomCol].type === SquareType.Bomb) {
      //     i--
      //     continue
      //   }

      newBoard[randomRow][randomCol].type = SquareType.Bomb

      newBoard[randomRow][randomCol].value = '💣'
    }

    // add values to the squares with the surrounding bombs
    for (let i = 0; i < boardSize; i++) {
      for (let j = 0; j < boardSize; j++) {
        if (newBoard[i][j].type === SquareType.Bomb) {
          continue
        }

        const bombCount = checkForBombs(i, j, newBoard, boardSize)
        // use checkForBombs to get the number of bombs surrounding the square
        newBoard[i][j].value = bombCount === 0 ? ' ' : String(bombCount)
      }
    }

    setBombsAdded(true)
    setBoard(newBoard)
  }

  const clickCell = async (currentBoard: any, row: number, col: number, isCellABomb: boolean = true) => {
    const newBoard = [...currentBoard]

    if (!newBoard[row] || !newBoard[row][col]) {
      return
    }
    if (isCellABomb) {
      setLastClicked([row, col])
    }

    if (newBoard[row][col].type !== SquareType.Bomb) {
      newBoard[row][col].hidden = false
    }

    if (newBoard[row][col].type === SquareType.Bomb && !lastClicked.length) {
      newBoard[row][col].type = SquareType.Number
      newBoard[row][col].value = checkForBombs(row, col, newBoard, boardSize)
      newBoard[row][col].hidden = false
    }

    if (newBoard[row][col].type === SquareType.Bomb && isCellABomb) {
      alert('You hit a bomb!')
      showAllCells()
      //   setBombsAdded(false)
      //   buildBoard()
      return
    }

    console.log(checkForBombs(row, col, newBoard, boardSize))

    if (checkForBombs(row, col, newBoard, boardSize) === 0) {
      // waterfall check the bordering cells
      if (
        row - 1 >= 0 &&
        col - 1 >= 0 &&
        newBoard[row - 1][col - 1].hidden &&
        newBoard[row - 1][col - 1].type !== SquareType.Bomb
      ) {
        clickCell(newBoard, row - 1, col - 1, false)
      }

      if (row - 1 >= 0 && newBoard[row - 1][col].hidden && newBoard[row - 1][col].type !== SquareType.Bomb) {
        clickCell(newBoard, row - 1, col, false)
      }

      if (
        row - 1 >= 0 &&
        col + 1 < boardSize &&
        newBoard[row - 1][col + 1].hidden &&
        newBoard[row - 1][col + 1].type !== SquareType.Bomb
      ) {
        clickCell(newBoard, row - 1, col + 1, false)
      }

      if (col - 1 >= 0 && newBoard[row][col - 1].hidden && newBoard[row][col - 1].type !== SquareType.Bomb) {
        clickCell(newBoard, row, col - 1, false)
      }

      if (col + 1 < boardSize && newBoard[row][col + 1].hidden && newBoard[row][col + 1].type !== SquareType.Bomb) {
        clickCell(newBoard, row, col + 1, false)
      }

      if (
        row + 1 < boardSize &&
        col - 1 >= 0 &&
        newBoard[row + 1][col - 1].hidden &&
        newBoard[row + 1][col - 1].type !== SquareType.Bomb
      ) {
        clickCell(newBoard, row + 1, col - 1, false)
      }

      if (row + 1 < boardSize && newBoard[row + 1][col].hidden && newBoard[row + 1][col].type !== SquareType.Bomb) {
        clickCell(newBoard, row + 1, col, false)
      }

      if (
        row + 1 < boardSize &&
        col + 1 < boardSize &&
        newBoard[row + 1][col + 1].hidden &&
        newBoard[row + 1][col + 1].type !== SquareType.Bomb
      ) {
        clickCell(newBoard, row + 1, col + 1, false)
      }

      //   clickCell(row - 1, col - 1, false)
      //   clickCell(row - 1, col, false)
      //   clickCell(row - 1, col + 1, false)
      //   clickCell(row, col - 1, false)
      //   clickCell(row, col + 1, false)
      //   clickCell(row + 1, col - 1, false)
      //   clickCell(row + 1, col, false)
      //   clickCell(row + 1, col + 1, false)
    }

    setBoard(newBoard)
  }

  useEffect(() => {
    const exportedData = localStorage.getItem('crossword')

    if (exportedData) {
      const parsedData = JSON.parse(exportedData)

      setBoard(parsedData.board)
    }
  }, [])

  useEffect(() => {
    if (!lastClicked.length && board.length && !bombsAdded) {
      addBombs()
    }
  }, [board, lastClicked, bombsAdded])

  return (
    <div className={styles.container}>
      <Row justify="start" align="middle">
        <Col>
          <Title>MineSweeper!</Title>
        </Col>
        <Col offset={1}>
          <Space>
            <Input
              value={boardSize}
              onChange={(e) => {
                setBoardSize(Number(e.target.value))
              }}
            />
            <Button
              onClick={() => {
                setBombsAdded(false)
                setLastClicked([])
                buildBoard()
              }}
            >
              Build!
            </Button>
          </Space>
        </Col>
      </Row>

      <Row>
        <Col offset={4}>
          <div>
            {board.map((row, rowIndex) => (
              <div key={rowIndex} className={styles.boardRow}>
                {row.map((square, squareIndex) => (
                  <div
                    key={squareIndex}
                    className={styles.mineCell}
                    onClick={() => {
                      clickCell(board, rowIndex, squareIndex)
                    }}
                    style={{
                      backgroundColor: square.hidden ? 'grey' : 'lightgrey'
                    }}
                  >
                    <span>{!square.hidden && (square.value || ' ')}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Col>
      </Row>
    </div>
  )
}

export default MineSweeper
