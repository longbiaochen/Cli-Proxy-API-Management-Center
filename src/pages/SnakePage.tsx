import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import styles from './SnakePage.module.scss';

const BOARD_SIZE = 14;
const INITIAL_SNAKE = [44, 43, 42];

type Direction = 'up' | 'down' | 'left' | 'right';

const randomFood = (occupied: Set<number>) => {
  const available: number[] = [];
  for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i += 1) {
    if (!occupied.has(i)) available.push(i);
  }
  return available[Math.floor(Math.random() * available.length)] ?? 0;
};

export function SnakePage() {
  const { t } = useTranslation();
  const [snake, setSnake] = useState<number[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Direction>('right');
  const [food, setFood] = useState<number>(80);
  const [gameOver, setGameOver] = useState(false);

  const score = snake.length - INITIAL_SNAKE.length;

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const nextDirection =
        event.key === 'ArrowUp'
          ? 'up'
          : event.key === 'ArrowDown'
            ? 'down'
            : event.key === 'ArrowLeft'
              ? 'left'
              : event.key === 'ArrowRight'
                ? 'right'
                : null;
      if (!nextDirection) return;
      setDirection((current) => {
        if (
          (current === 'up' && nextDirection === 'down') ||
          (current === 'down' && nextDirection === 'up') ||
          (current === 'left' && nextDirection === 'right') ||
          (current === 'right' && nextDirection === 'left')
        ) {
          return current;
        }
        return nextDirection;
      });
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    if (gameOver) return;
    const timer = window.setInterval(() => {
      setSnake((current) => {
        const head = current[0];
        const row = Math.floor(head / BOARD_SIZE);
        const col = head % BOARD_SIZE;
        let next = head;
        if (direction === 'up') next = head - BOARD_SIZE;
        if (direction === 'down') next = head + BOARD_SIZE;
        if (direction === 'left') next = head - 1;
        if (direction === 'right') next = head + 1;

        const hitWall =
          next < 0 ||
          next >= BOARD_SIZE * BOARD_SIZE ||
          (direction === 'left' && col === 0) ||
          (direction === 'right' && col === BOARD_SIZE - 1) ||
          (direction === 'up' && row === 0) ||
          (direction === 'down' && row === BOARD_SIZE - 1);

        if (hitWall || current.includes(next)) {
          setGameOver(true);
          return current;
        }

        const grown = [next, ...current];
        if (next === food) {
          setFood(randomFood(new Set(grown)));
          return grown;
        }
        grown.pop();
        return grown;
      });
    }, 180);
    return () => window.clearInterval(timer);
  }, [direction, food, gameOver]);

  const cells = useMemo(() => Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => index), []);

  const restart = () => {
    setSnake(INITIAL_SNAKE);
    setDirection('right');
    setFood(80);
    setGameOver(false);
  };

  return (
    <div className={styles.container}>
      <Card title={t('snake.title')}>
        <div className={styles.intro}>{t('snake.description')}</div>
      </Card>
      <Card
        title={t('snake.playground')}
        extra={
          <Button variant="secondary" size="sm" onClick={restart}>
            {t('snake.restart')}
          </Button>
        }
      >
        <div className={styles.status}>
          <div className={styles.score}>
            {t('snake.score')}: {score}
          </div>
          <div>{gameOver ? t('snake.game_over') : t('snake.running')}</div>
        </div>
        <div className={styles.boardWrap}>
          <div className={styles.board}>
            {cells.map((cell) => {
              const snakeIndex = snake.indexOf(cell);
              const classNames = [styles.cell];
              if (cell === food) classNames.push(styles.food);
              if (snakeIndex >= 0) classNames.push(styles.snake);
              if (snakeIndex === 0) classNames.push(styles.head);
              return <div key={cell} className={classNames.join(' ')} />;
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
