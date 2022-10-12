import type { NextPage } from 'next'
import { Col, Row, Input, Typography, Space, Button } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import styles from '../styles/Home.module.css'
import LZUTF8 from 'lzutf8'

const { Title } = Typography

enum SquareType {
  Black = 'black-square',
  White = 'white-square'
}

enum Dimension {
  Row = 'row',
  Column = 'column'
}

interface ISquare {
  type: SquareType
  value: string
  cellNumber: number | null
  clue: {
    row: string
    column: string
  }
}

interface IClue {
  clue: string
  cellNumber: number | null
}

interface IConnectedWord {
  dimension: Dimension
  cellNumber: number
  cells: number[][] | null
}

const Play: NextPage = () => {
  const [board, setBoard] = useState<ISquare[][]>([])
  const [connectedWords, setConnectedWords] = useState<IConnectedWord[]>([])
  const [boardSize, setBoardSize] = useState<number>(15)
  const [currentCell, setCurrentCell] = useState<number[]>([])
  const [dimension, setDimension] = useState<Dimension>(Dimension.Row)
  const [exportData, setExportData] = useState<string>('')

  useEffect(() => {
    const newBoard = []

    for (let i = 0; i < boardSize; i++) {
      const row = []

      for (let j = 0; j < boardSize; j++) {
        row.push({ type: SquareType.White, value: '', cellNumber: null, clue: { row: '', column: '' } })
      }

      newBoard.push(row)
    }

    setBoard(newBoard)
  }, [boardSize])

  const focusSquare = (row: number, col: number) => {
    const nextCol = col + 1
    const nextRow = row + 1

    if (nextCol < boardSize) {
      if (dimension === Dimension.Row) {
        const nextCell = document.getElementById(`${row}-${nextCol}`)
        if (board[row][nextCol].type === SquareType.Black) {
          focusSquare(row, nextCol)
        } else {
          nextCell?.focus()
          setCurrentCell([row, nextCol])
        }
      } else {
        const nextCell = document.getElementById(`${nextRow}-${col}`)

        if (board[nextRow][col].type === SquareType.Black) {
          focusSquare(nextRow, col)
        } else {
          nextCell?.focus()
          setCurrentCell([nextRow, col])
        }
      }
    }

    if (nextCol === boardSize) {
      if (nextRow < boardSize) {
        const nextCell = document.getElementById(`${nextRow}-0`)

        if (board[nextRow][0].type === SquareType.Black) {
          focusSquare(nextRow, 0)
        } else {
          nextCell?.focus()
          setCurrentCell([nextRow, 0])
        }
      }
    }

    if (dimension === Dimension.Column && nextRow === boardSize) {
      const nextCell = document.getElementById(`0-${col}`)

      if (board[0][col].type === SquareType.Black) {
        focusSquare(0, col)
      } else {
        nextCell?.focus()
        setCurrentCell([0, col])
      }
    }
  }

  const addLetterToBoard = (letter: string, row: number, col: number) => {
    const newBoard = [...board]

    newBoard[row][col].value = letter
    console.log({ letter })

    setBoard(newBoard)

    focusSquare(row, col)
  }

  const getCellBackgroundColor = (row: number, col: number) => {
    // currentCell[0] === rowIndex && currentCell[1] === squareIndex ? 'khaki' : 'white'
    const anchorCell = currentCell

    if (anchorCell.length === 0) {
      return 'white'
    }

    const showConnectedWords = connectedWords.some(
      (word) => word.cellNumber === board[anchorCell[0]][anchorCell[1]].cellNumber && word.dimension === dimension
    )

    if (anchorCell[0] === row && anchorCell[1] === col) {
      return 'khaki'
    }

    if (showConnectedWords) {
      const connectedWord = connectedWords.find((word) =>
        word.cells?.some((cell) => cell[0] === row && cell[1] === col)
      )

      if (connectedWord) {
        return 'rgb(30, 144, 255, 0.5)'
      }
    }

    // from the current cell highlight the row and column until you hit a black square
    if (dimension === Dimension.Row) {
      // check if between the current cell and the cell we are checking is a black square
      const isBetweenBlackSquare = board[row]
        .slice(anchorCell[1] < col ? anchorCell[1] : col, anchorCell[1] < col ? col : anchorCell[1])
        .some((square) => square.type === SquareType.Black)

      if (row === anchorCell[0] && !isBetweenBlackSquare) {
        return 'rgb(30, 144, 255, 0.5)'
      }
    }

    if (dimension === Dimension.Column) {
      // check if between the current cell and the cell we are checking is a black square
      const isBetweenBlackSquare = board
        .slice(anchorCell[0] < row ? anchorCell[0] : row, anchorCell[0] < row ? row : anchorCell[0])
        .some((row) => row[col].type === SquareType.Black)

      if (col === anchorCell[1] && !isBetweenBlackSquare) {
        return 'rgb(30, 144, 255, 0.5)'
      }
    }
  }

  // if back space is pressed, delete the letter and move to the previous cell
  const onBackspace = useCallback(() => {
    const anchorCell = currentCell

    if (anchorCell.length === 0) {
      return
    }

    const newBoard = [...board]

    newBoard[anchorCell[0]][anchorCell[1]].value = ''

    setBoard(newBoard)

    const prevCol = anchorCell[1] - 1
    const prevRow = anchorCell[0] - 1

    if (prevCol >= 0) {
      if (dimension === Dimension.Row) {
        const prevCell = document.getElementById(`${anchorCell[0]}-${prevCol}`)

        if (board[anchorCell[0]][prevCol].type === SquareType.Black) {
          onBackspace()
          setCurrentCell([anchorCell[0], prevCol])
        } else {
          prevCell?.focus()
          setCurrentCell((x) => [anchorCell[0], prevCol])
          return
        }
      } else {
        const prevCell = document.getElementById(`${prevRow}-${anchorCell[1]}`)
        if (board[prevRow][anchorCell[1]].type === SquareType.Black) {
          onBackspace()
          setCurrentCell([prevRow, anchorCell[1]])
        } else {
          prevCell?.focus()
          setCurrentCell([prevRow, anchorCell[1]])
        }
      }
    }

    if (prevCol < 0) {
      if (prevRow >= 0) {
        const prevCell = document.getElementById(`${prevRow}-${boardSize - 1}`)
        if (board[prevRow][boardSize - 1].type === SquareType.Black) {
          onBackspace()
          setCurrentCell([prevRow, boardSize - 1])
        } else {
          prevCell?.focus()
          setCurrentCell([prevRow, boardSize - 1])
        }
      }
    }

    if (dimension === Dimension.Column && prevRow < 0) {
      const prevCell = document.getElementById(`${boardSize - 1}-${anchorCell[1]}`)
      if (board[boardSize - 1][anchorCell[1]].type === SquareType.Black) {
        onBackspace()
        setCurrentCell([boardSize - 1, anchorCell[1]])
      } else {
        prevCell?.focus()
        setCurrentCell([boardSize - 1, anchorCell[1]])
      }
    }
  }, [board, boardSize, currentCell, dimension])

  useEffect(() => {
    const onKeyDown = (e: any) => {
      if (e.key === 'Backspace') {
        onBackspace()
      }
    }

    window.removeEventListener('keydown', onKeyDown)

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onBackspace])

  return (
    <div className={styles.container}>
      <Title>Crossword!</Title>

      <Row>
        <Col offset={4}>
          <div>
            {board.map((row, rowIndex) => (
              <div key={rowIndex} className={styles.boardRow}>
                {row.map((square, squareIndex) => (
                  <div key={squareIndex} className={styles.whiteCell}>
                    <span className={styles.cellNumber}>{square.cellNumber}</span>

                    {square.type === SquareType.White ? (
                      <Input
                        onClick={() => {
                          if (currentCell[0] !== rowIndex || currentCell[1] !== squareIndex) {
                            setCurrentCell([rowIndex, squareIndex])
                            setDimension(Dimension.Row)
                          } else {
                            setDimension(dimension === Dimension.Row ? Dimension.Column : Dimension.Row)
                          }
                        }}
                        id={`${rowIndex}-${squareIndex}`}
                        value={square.value?.toUpperCase()}
                        onChange={(e) => {
                          console.log({ a: e.target.value })
                          const letter = e.target.value.slice(-1)
                          console.log({ b: letter })

                          if (!letter.match(/[a-z]/i)) {
                            return
                          }

                          addLetterToBoard(letter, rowIndex, squareIndex)
                        }}
                        style={{
                          backgroundColor: getCellBackgroundColor(rowIndex, squareIndex)
                        }}
                      />
                    ) : (
                      <div className={styles.blackCell} />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Col>

        <Col offset={1}>
          <Space direction="vertical">
            <Title>Vertical</Title>
            {board
              .reduce((acc: IClue[], row, rowIndex) => {
                row.forEach((square, squareIndex) => {
                  if (square.clue.column) {
                    if (!square.cellNumber) {
                      return
                    }

                    if (acc.find(({ clue }) => clue === square.clue.column)) {
                      return
                    }

                    acc.push({
                      clue: square.clue.column,
                      cellNumber: square.cellNumber
                    })
                  }
                })

                return acc
              }, [])
              .map(({ clue, cellNumber }: any, index: number) => (
                <div key={index}>
                  <span style={{ marginRight: '10px' }}>{cellNumber}.</span>
                  <span>{clue}</span>
                </div>
              ))}
          </Space>
        </Col>

        <Col offset={1}>
          <Space direction="vertical">
            <Title>Horizontal</Title>
            {board
              .reduce((acc: IClue[], row, rowIndex) => {
                row.forEach((square, squareIndex) => {
                  if (square.clue.row) {
                    if (!square.cellNumber) {
                      return
                    }

                    if (acc.find(({ clue }) => clue === square.clue.row)) {
                      return
                    }

                    acc.push({
                      clue: square.clue.row,
                      cellNumber: square.cellNumber
                    })
                  }
                })

                return acc
              }, [])
              .map(({ clue, cellNumber }: any, index: number) => (
                <div key={index}>
                  <span style={{ marginRight: '10px' }}>{cellNumber}.</span>
                  <span>{clue}</span>
                </div>
              ))}
          </Space>
        </Col>
      </Row>
      <br />
      <Row>
        <Col span={10} offset={4}>
          <Input.TextArea
            onChange={(e) => {
              setExportData(e.target.value)
            }}
            value={exportData}
          />
        </Col>
        <Button
          onClick={() => {
            const data = JSON.parse(exportData)

            setBoard(data.board)
            setConnectedWords(data.connectedWords)
            setExportData('')
          }}
        >
          Load
        </Button>
      </Row>
    </div>
  )
}

export default Play
