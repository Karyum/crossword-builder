import type { NextPage } from 'next'
import {
  Col,
  Row,
  Input,
  InputNumber,
  Typography,
  Form,
  message,
  Space,
  Checkbox,
  Button,
  Popconfirm,
  Switch
} from 'antd'
import { useCallback, useEffect, useState } from 'react'
import styles from '../styles/Home.module.css'

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

const Home: NextPage = () => {
  const [board, setBoard] = useState<ISquare[][]>([])
  const [connectedWords, setConnectedWords] = useState<IConnectedWord[]>([])
  const [boardSize, setBoardSize] = useState<number>(15)
  const [currentCell, setCurrentCell] = useState<number[]>([])
  const [dimension, setDimension] = useState<Dimension>(Dimension.Row)
  const [exportData, setExportData] = useState<string>('')
  const [mirrorBlackCells, setMirrorBlackCells] = useState<boolean>(true)

  const buildBoard = useCallback(
    (boardData?: any) => {
      const newBoard = []

      for (let i = 0; i < boardSize; i++) {
        const row = []

        for (let j = 0; j < boardSize; j++) {
          if (boardData && boardData[i] && boardData[i][j]) {
            row.push(boardData[i][j])
          } else {
            row.push({ type: SquareType.White, value: '', cellNumber: null, clue: { row: '', column: '' } })
          }
        }

        newBoard.push(row)
      }

      setBoard(newBoard)
    },
    [boardSize]
  )

  useEffect(() => {
    const data = localStorage.getItem('crossword-builder')

    if (data) {
      const { board, connectedWords } = JSON.parse(data)
      buildBoard(board)
      setConnectedWords(connectedWords)
    } else {
      buildBoard()
    }
  }, [boardSize, buildBoard])

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

    setBoard(newBoard)

    focusSquare(row, col)
  }

  const turnCellBlack = (row: number, col: number) => {
    const newBoard = [...board]

    // also turn the parallel cell black on the grid
    if (newBoard[row][col].type === SquareType.White) {
      newBoard[row][col].type = SquareType.Black

      if (mirrorBlackCells) {
        newBoard[boardSize - row - 1][boardSize - col - 1].type = SquareType.Black
      }
    } else {
      newBoard[row][col].type = SquareType.White

      if (mirrorBlackCells) {
        newBoard[boardSize - row - 1][boardSize - col - 1].type = SquareType.White
      }
    }

    setBoard(newBoard)
  }

  const getCellBackgroundColor = (row: number, col: number) => {
    // currentCell[0] === rowIndex && currentCell[1] === squareIndex ? 'khaki' : 'white'
    const anchorCell = currentCell
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

  const addClueToWord = (clue: string) => {
    const newBoard = [...board]
    const [row, col] = currentCell

    if (dimension === Dimension.Row) {
      newBoard[row][col].clue.row = clue

      for (let i = col + 1; i < boardSize; i++) {
        if (newBoard[row][i].type === SquareType.Black) {
          break
        }

        newBoard[row][i].clue.row = clue
      }
    } else {
      newBoard[row][col].clue.column = clue

      for (let i = row + 1; i < boardSize; i++) {
        if (newBoard[i][col].type === SquareType.Black) {
          break
        }

        newBoard[i][col].clue.column = clue
      }
    }

    setBoard(newBoard)
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

  useEffect(() => {
    if (!board.length) {
      return
    }

    const data = {
      board,
      connectedWords
    }

    localStorage.setItem('crossword-builder', JSON.stringify(data))
  }, [board, connectedWords])

  return (
    <div className={styles.container}>
      <div>
        <Form.Item label="Mirror black cells">
          <Switch checked={mirrorBlackCells} onChange={(checked) => setMirrorBlackCells(checked)} />
        </Form.Item>
      </div>
      <Title>Crossword Builder</Title>
      {/* <Row>
        <Col span={6}>
          <Form.Item label="Board size">
            <InputNumber
              min={1}
              max={20}
              value={boardSize}
              onChange={(value) => {
                setBoardSize(value || 1)
              }}
            />
          </Form.Item>
        </Col>
      </Row> */}

      <Row>
        <Col>
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
                          const letter = e.target.value.slice(-1)

                          if (!letter.match(/[a-z]/i)) {
                            return
                          }

                          addLetterToBoard(letter, rowIndex, squareIndex)
                        }}
                        onDoubleClick={() => {
                          turnCellBlack(rowIndex, squareIndex)
                        }}
                        style={{
                          backgroundColor: getCellBackgroundColor(rowIndex, squareIndex)
                        }}
                      />
                    ) : (
                      <div
                        onDoubleClick={() => {
                          turnCellBlack(rowIndex, squareIndex)
                        }}
                        className={styles.blackCell}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Col>

        {!!currentCell.length && (
          <Col offset={1}>
            <Space direction="vertical">
              <Form layout="vertical">
                <Form.Item label="Cell number">
                  <InputNumber
                    className={styles.controlInput}
                    value={currentCell.length ? board[currentCell[0]][currentCell[1]].cellNumber : null}
                    onChange={(value) => {
                      const newBoard = [...board]

                      if (currentCell.length) {
                        newBoard[currentCell[0]][currentCell[1]].cellNumber = value || null

                        setBoard(newBoard)
                      }
                    }}
                  />
                </Form.Item>
                <Form.Item label="Clue">
                  <Input.TextArea
                    onChange={(e) => {
                      addClueToWord(e.target.value)
                    }}
                    value={board[currentCell[0]][currentCell[1]].clue[dimension] || ''}
                  />
                </Form.Item>
                <Space direction="vertical">
                  <Button
                    onClick={() => {
                      // export the board and connected words
                      // remove letters from the board
                      setExportData(
                        JSON.stringify({
                          board: board,
                          connectedWords
                        })
                      )

                      const copyButton = document.getElementById('copy-button')
                      if (copyButton) {
                        copyButton.scrollIntoView({ behavior: 'smooth' })
                      }
                    }}
                  >
                    Export
                  </Button>
                  <br />
                  <Popconfirm
                    title="Are you sure you want to clear the board?"
                    onConfirm={() => {
                      localStorage.removeItem('crossword-builder')
                      buildBoard()
                      setConnectedWords([])
                      setDimension(Dimension.Row)
                      setCurrentCell([])
                    }}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button>Clear board</Button>
                  </Popconfirm>
                </Space>
                {/* <Form.Item label="Connected words">
                  <Input />
                </Form.Item> */}
              </Form>
            </Space>
          </Col>
        )}

        {/* Vertical Clues */}
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
                  <Checkbox
                    style={{ marginRight: '10px' }}
                    onChange={(e) => {
                      if (e.target.checked) {
                        let cells: number[][] = []

                        board.forEach((row, rowIndex) => {
                          row.forEach((square, colIndex) => {
                            if (square.clue.column === clue) {
                              cells.push([rowIndex, colIndex])
                            }
                          })
                        })

                        setConnectedWords(
                          connectedWords.concat({
                            cellNumber: cellNumber,
                            dimension: Dimension.Column,
                            cells
                          })
                        )
                      } else {
                        setConnectedWords(
                          connectedWords.filter(
                            (word) => word.cellNumber !== cellNumber && word.dimension !== Dimension.Column
                          )
                        )
                      }
                    }}
                  />
                  <span style={{ marginRight: '10px' }}>{cellNumber}.</span>
                  <span>{clue}</span>
                </div>
              ))}
          </Space>
        </Col>

        {/* Horizontal clues */}
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
                  <Checkbox
                    style={{ marginRight: '10px' }}
                    onChange={(e) => {
                      if (e.target.checked) {
                        let cells: number[][] = []

                        board.forEach((row, rowIndex) => {
                          row.forEach((square, colIndex) => {
                            if (square.clue.row === clue) {
                              cells.push([rowIndex, colIndex])
                            }
                          })
                        })

                        setConnectedWords(
                          connectedWords.concat({
                            cellNumber: cellNumber,
                            dimension: Dimension.Row,
                            cells
                          })
                        )
                      } else {
                        setConnectedWords(
                          connectedWords.filter(
                            (word) => word.cellNumber !== cellNumber && word.dimension !== Dimension.Row
                          )
                        )
                      }
                    }}
                  />
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
          <Input.TextArea value={exportData} />
        </Col>
        <Button
          id="copy-button"
          onClick={() => {
            // copy the export data to clipboard
            navigator.clipboard.writeText(exportData)
            message.success('Copied to clipboard')
          }}
        >
          Copy
        </Button>
      </Row>
    </div>
  )
}

export default Home
