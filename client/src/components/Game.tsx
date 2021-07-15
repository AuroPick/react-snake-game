import { motion, useAnimation } from 'framer-motion';
import React, { useEffect, useState, useRef } from 'react';
import { useInterval } from '../hooks';
import EatFood from '../assets/sounds/eatFood.mp3';
import GameOver from '../assets/sounds/gameOver.mp3';
import Jump from '../assets/sounds/jump.mp3';
import ThemeMusic from '../assets/sounds/themeMusic.mp3';

const eatFood = new Audio(EatFood);
const gameOver = new Audio(GameOver);
const jump = new Audio(Jump);
const themeMusic = new Audio(ThemeMusic);

themeMusic.loop = true;
themeMusic.volume = 0.15;

let interval: NodeJS.Timeout;

const CANVAS_SIZE =
  window.innerWidth > 1919 && window.innerHeight > 1079
    ? [1920, 900]
    : window.innerWidth > 1536 && window.innerHeight > 864
    ? [1500, 720]
    : window.innerWidth > 1279 && window.innerHeight > 719
    ? [1200, 600]
    : window.innerWidth > 767 && window.innerHeight > 431
    ? [690, 390]
    : [900, 600];
const SNAKE_START = [
  [9, 8],
  [8, 8],
];
const APPLE_START = [10, 20];
const SCALE =
  window.innerWidth > 1919 && window.innerHeight > 1079
    ? 30
    : window.innerWidth > 1536 && window.innerHeight > 864
    ? 25
    : window.innerWidth > 1279 && window.innerHeight > 719
    ? 20
    : window.innerWidth > 767 && window.innerHeight > 431
    ? 15
    : 18;

const appleIcon = new Image();
appleIcon.src = 'https://cdn.gamedevmarket.net/wp-content/uploads/20200305090324/b89792347c16340b1d1fffcac31f850b.png';

const snakeHead = new Image();
snakeHead.src = 'https://pixelartmaker-data-78746291193.nyc3.digitaloceanspaces.com/image/2ff5966906c4cb6.png';

const snakeTail = new Image();
snakeTail.src = 'https://i.hizliresim.com/7zrgugd.png';

export const Game: React.FC = () => {
  const [countdown, setCountdown] = useState(3);
  const [score, setScore] = useState(0);
  const [snake, setSnake] = useState(SNAKE_START);
  const [apple, setApple] = useState(APPLE_START);
  const [direction, setDirection] = useState([1, 0]);
  const [speed, setSpeed] = useState<number | null>(null);
  const [isDead, setIsDead] = useState(false);

  const canvasAnimation = useAnimation();

  const counterRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const createApple = () => apple.map((_a, i) => Math.floor(Math.random() * (CANVAS_SIZE[i] / SCALE)));

  const moveSnake = ({ keyCode }: { keyCode: number }) => {
    if (
      keyCode === 37 &&
      JSON.stringify(direction) != JSON.stringify([1, 0]) &&
      JSON.stringify(direction) != JSON.stringify([-1, 0])
    ) {
      jump.play();
      setDirection([-1, 0]);
    }
    if (
      keyCode === 38 &&
      JSON.stringify(direction) != JSON.stringify([0, 1]) &&
      JSON.stringify(direction) != JSON.stringify([0, -1])
    ) {
      jump.play();
      setDirection([0, -1]);
    }
    if (
      keyCode === 39 &&
      JSON.stringify(direction) != JSON.stringify([-1, 0]) &&
      JSON.stringify(direction) != JSON.stringify([1, 0])
    ) {
      jump.play();
      setDirection([1, 0]);
    }
    if (
      keyCode === 40 &&
      JSON.stringify(direction) != JSON.stringify([0, -1]) &&
      JSON.stringify(direction) != JSON.stringify([0, 1])
    ) {
      jump.play();
      setDirection([0, 1]);
    }
  };

  const checkCollision = (piece: number[], snk: typeof snake = snake) => {
    if (piece[0] * SCALE >= CANVAS_SIZE[0] || piece[0] < 0 || piece[1] * SCALE >= CANVAS_SIZE[1] || piece[1] < 0)
      return true;

    for (const segment of snk) {
      if (piece[0] === segment[0] && piece[1] === segment[1]) return true;
    }

    return false;
  };

  const checkAppleCollision = (newSnake: typeof snake) => {
    if (newSnake[0][0] === apple[0] && newSnake[0][1] === apple[1]) {
      setScore(prevState => prevState + 1);
      eatFood.play();
      setSpeed(prevState => prevState && prevState - 1);
      let newApple = createApple();
      while (checkCollision(newApple, newSnake)) {
        newApple = createApple();
      }
      setApple(newApple);
      return true;
    }
    return false;
  };

  const startCountdown = () => {
    interval = setInterval(() => {
      setCountdown(prevCount => prevCount - 1);
    }, 1000);
  };

  const startGame = () => {
    setSnake(SNAKE_START);
    setApple(APPLE_START);
    setDirection([1, 0]);
    setSpeed(100);
    setIsDead(false);
    themeMusic.play();
  };

  const endGame = async () => {
    setSpeed(null);
    setIsDead(true);
    themeMusic.pause();
    themeMusic.currentTime = 0;
    gameOver.play();
    await canvasAnimation.start({
      y: 200,
      rotateZ: 10,
      opacity: 0,
      transition: { duration: 1 },
    });
    if (canvasRef.current) canvasRef.current.style.display = 'none';
  };

  const update = () => {
    const snakeCopy = JSON.parse(JSON.stringify(snake));
    const newSnakeHead = [snakeCopy[0][0] + direction[0], snakeCopy[0][1] + direction[1]];
    snakeCopy.unshift(newSnakeHead);
    if (checkCollision(newSnakeHead)) endGame();
    if (!checkAppleCollision(snakeCopy)) snakeCopy.pop();
    setSnake(snakeCopy);
  };

  useInterval(() => update(), speed);

  useEffect(() => {
    if (countdown <= 0) {
      clearInterval(interval);
      setTimeout(() => {
        if (counterRef.current) counterRef.current.style.display = 'none';
        canvasRef.current?.focus();
        startGame();
      }, 1000);
    }
  }, [countdown]);

  useEffect(() => {
    startCountdown();
  }, []);

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');

    if (context) {
      context.setTransform(SCALE, 0, 0, SCALE, 0, 0);
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      context.fillStyle = 'rgb(209, 213, 219)';
      snake.forEach(([x, y], i) => {
        if (i === 0) return context.drawImage(snakeHead, x, y, 1, 1);
        context.drawImage(snakeTail, x, y, 1, 1);
      });
      context.drawImage(appleIcon, apple[0], apple[1], 1, 1);
    }
  }, [snake, apple, isDead]);

  return (
    <div className="flex flex-col h-screen items-center relative">
      <motion.div
        ref={counterRef}
        animate={{
          scale: [0, 7, 0, 7, 0, 7, 0, 7, 7],
          opacity: [0, 1, 0, 1, 0, 1, 0, 1, 0],
        }}
        initial={{
          opacity: 0,
          scale: 0,
        }}
        transition={{ duration: 4 }}
        className="text-gray-300 text-6xl"
        style={{ position: 'absolute', top: '50%', left: '50%', userSelect: 'none' }}
      >
        {countdown}
      </motion.div>
      <div className="flex flex-col items-center py-3">
        <h3 className="text-gray-300 text-4xl">Score</h3>
        <h4 className="text-gray-300 text-3xl">{score}</h4>
      </div>
      <motion.canvas
        animate={canvasAnimation}
        tabIndex={0}
        ref={canvasRef}
        width={`${CANVAS_SIZE[0]}px`}
        height={`${CANVAS_SIZE[1]}px`}
        className="border-2 border-gray-500 focus:outline-none bg-primary"
        onKeyDown={e => moveSnake(e)}
      />
    </div>
  );
};
