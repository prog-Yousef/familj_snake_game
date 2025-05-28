import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Play, Pause, RotateCcw, Volume2, VolumeX, Heart, Star, Zap, ShieldCheck, Cherry as CherryIcon } from 'lucide-react';

const GRID_COLS = 11;
const GRID_ROWS = 12;
const INITIAL_SNAKE = [{ x: 5, y: 5 }];
const INITIAL_DIRECTION = 'RIGHT';
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 0.1;

// Barn Foto Snacke Feature Constants
const IMAGE_POPUP_SCORE_INTERVAL = 15;
const NUM_BARN_FOTOS = 21; 
const IMAGE_POPUP_DURATION = 3000; // Total duration the panel is shown

const SNAKE_COLOR_THEMES = [
  { head: 'bg-green-500 ring-2 ring-green-300', body: 'bg-green-400' }, 
  { head: 'bg-yellow-400 ring-2 ring-yellow-200', body: 'bg-yellow-300' }, 
  { head: 'bg-sky-500 ring-2 ring-sky-300', body: 'bg-sky-400' }, 
  { head: 'bg-red-500 ring-2 ring-red-300', body: 'bg-red-400' }, 
  { head: 'bg-purple-500 ring-2 ring-purple-300', body: 'bg-purple-400' }, 
];

const POWER_UPS = {
  PIZZA: { iconEmoji: '🍕', points: 1, probability: 0.40, description: "Yummy Pizza!", isActualFood: true, color: 'bg-orange-300', textColor: 'text-orange-800' },
  HAMBURGER: { iconEmoji: '🍔', points: 1, probability: 0.35, description: "Super Burger!", isActualFood: true, color: 'bg-yellow-400', textColor: 'text-yellow-800' },
  CHERRY: { iconEmoji: '🍒', points: 3, probability: 0.10, description: "Sweet Cherries!", isActualFood: true, color: 'bg-red-400', textColor: 'text-red-800' }, 
  SPEED: { icon: <Zap size={18} className="inline-block text-yellow-800"/>, points: 0, probability: 0.08, description: "Zoom Fast!", color: 'bg-yellow-300', textColor: 'text-yellow-800', iconEmoji: '⚡️', isActualFood: false },
  SHIELD: { icon: <ShieldCheck size={18} className="inline-block text-sky-800"/>, points: 0, probability: 0.07, description: "Safe Shield!", color: 'bg-sky-300', textColor: 'text-sky-800', iconEmoji: '🛡️', isActualFood: false }
};

const getRandomFoodType = () => {
  const rand = Math.random();
  let cumulativeProbability = 0;
  for (const type in POWER_UPS) {
    cumulativeProbability += POWER_UPS[type].probability;
    if (rand < cumulativeProbability) {
      return type;
    }
  }
  return 'PIZZA'; 
};

const getRandomImageName = () => { 
  if (NUM_BARN_FOTOS === 0) return '';
  const randomIndex = Math.floor(Math.random() * NUM_BARN_FOTOS) + 1;
  return `${randomIndex}.jpg`;
};

const SnakeGame = () => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: Math.floor(Math.random() * GRID_COLS), y: Math.floor(Math.random() * GRID_ROWS), type: getRandomFoodType() });
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snakeHighScore');
    return saved ? parseInt(saved) : 0;
  });
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(INITIAL_SPEED);
  const [hasShield, setHasShield] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [currentThemeIndex, setCurrentThemeIndex] = useState(0);
  const [currentRandomImageName, setCurrentRandomImageName] = useState('');

  const gameLoopRef = useRef();
  const audioContextRef = useRef();
  const currentSnakeColor = SNAKE_COLOR_THEMES[currentThemeIndex];

  // Initialize audio context
  useEffect(() => {
    if (!isMuted && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.log('Audio not supported');
      }
    }
  }, [isMuted]);

  // Play sound effect
  const playSound = useCallback((frequency, duration = 100) => {
    if (isMuted || !audioContextRef.current) return;
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.05, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.005, audioContextRef.current.currentTime + duration / 1000);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration / 1000);
    } catch (e) {
      console.log('Audio playback failed');
    }
  }, [isMuted]);

  // Generate random food position
  const generateFood = useCallback(() => {
    let newFoodPosition;
    do {
      newFoodPosition = {
        x: Math.floor(Math.random() * GRID_COLS),
        y: Math.floor(Math.random() * GRID_ROWS),
      };
    } while (snake.some(segment => segment.x === newFoodPosition.x && segment.y === newFoodPosition.y));
    
    return {...newFoodPosition, type: getRandomFoodType()};
  }, [snake]);

  // Handle food consumption
  const handleFoodConsumption = useCallback((foodType) => {
    const consumedItem = POWER_UPS[foodType];
    setScore(prev => prev + consumedItem.points);
    playSound(660, 120);

    if (consumedItem.isActualFood) {
      setCurrentThemeIndex(prev => (prev + 1) % SNAKE_COLOR_THEMES.length);
    }
    
    switch (foodType) {
      case 'SPEED':
        setGameSpeed(prev => Math.max(50, prev * 0.75));
        setTimeout(() => setGameSpeed(prev => prev / 0.75), 4000);
        break;
      case 'SHIELD':
        setHasShield(true);
        setTimeout(() => setHasShield(false), 12000);
        break;
    }
  }, [playSound]);

  // Move snake
  const moveSnake = useCallback(() => {
    if (isPaused || isGameOver) return;
    setSnake(currentSnake => {
      const head = { ...currentSnake[0] };
      switch (direction) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }
      if (head.x < 0 || head.x >= GRID_COLS || head.y < 0 || head.y >= GRID_ROWS) {
        if (hasShield) { 
            setHasShield(false); 
            playSound(300, 200); 
            return currentSnake; 
        } else { 
            if (NUM_BARN_FOTOS > 0) setCurrentRandomImageName(getRandomImageName());
            clearTimeout(gameLoopRef.current); 
            setIsGameOver(true); 
            playSound(200, 400); 
            return currentSnake; 
        }
      }
      if (currentSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        if (hasShield) { 
            setHasShield(false); 
            playSound(300, 200); 
            return currentSnake; 
        } else { 
            if (NUM_BARN_FOTOS > 0) setCurrentRandomImageName(getRandomImageName());
            clearTimeout(gameLoopRef.current); 
            setIsGameOver(true); 
            playSound(200, 400); 
            return currentSnake; 
        }
      }
      const newSnake = [head, ...currentSnake];

      if (head.x === food.x && head.y === food.y) {
        handleFoodConsumption(food.type);
        setFood(generateFood());
        return newSnake;
      }

      return newSnake.slice(0, -1);
    });
  }, [direction, isPaused, isGameOver, food, hasShield, handleFoodConsumption, generateFood, playSound]);

  // Game loop
  useEffect(() => {
    if (!isGameOver && !isPaused) {
      gameLoopRef.current = setTimeout(moveSnake, gameSpeed);
    }
    return () => clearTimeout(gameLoopRef.current);
  }, [moveSnake, gameSpeed, isGameOver, isPaused]);

  // Update high score & Barn Foto Snacke popup trigger
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('snakeHighScore', score.toString());
    }
  }, [score, highScore]);

  // Increase speed based on score
  useEffect(() => {
    const newSpeed = Math.max(40, INITIAL_SPEED - Math.floor(score / 4) * (INITIAL_SPEED * SPEED_INCREMENT));
    setGameSpeed(newSpeed);
  }, [score]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (isGameOver) return;
      
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
          e.preventDefault(); if (direction !== 'DOWN') setDirection('UP'); break;
        case 'ArrowDown': case 's': case 'S':
          e.preventDefault(); if (direction !== 'UP') setDirection('DOWN'); break;
        case 'ArrowLeft': case 'a': case 'A':
          e.preventDefault(); if (direction !== 'RIGHT') setDirection('LEFT'); break;
        case 'ArrowRight': case 'd': case 'D':
          e.preventDefault(); if (direction !== 'LEFT') setDirection('RIGHT'); break;
        case ' ':
          e.preventDefault(); setIsPaused(prev => !prev); break;
        case 'r': case 'R':
          e.preventDefault(); resetGame(); break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, isGameOver, isPaused]);

  // Touch controls
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e) => {
    if (isGameOver || isPaused) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const minSwipeDistance = 25;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0 && direction !== 'LEFT') setDirection('RIGHT');
        else if (deltaX < 0 && direction !== 'RIGHT') setDirection('LEFT');
      }
    } else {
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0 && direction !== 'UP') setDirection('DOWN');
        else if (deltaY < 0 && direction !== 'DOWN') setDirection('UP');
      }
    }
  };

  // Reset game
  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(generateFood()); 
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setGameSpeed(INITIAL_SPEED);
    setHasShield(false);
    setCurrentThemeIndex(0); 
    setCurrentRandomImageName('');
    playSound(440,100);
  };

  // Virtual controls
  const handleDirectionChange = (newDirection) => {
    if (isGameOver || isPaused) return;
    const opposites = { 'UP': 'DOWN', 'DOWN': 'UP', 'LEFT': 'RIGHT', 'RIGHT': 'LEFT' };
    if (direction !== opposites[newDirection]) setDirection(newDirection);
  };

  const togglePause = () => {
    if(isGameOver) return;
    setIsPaused(p => !p);
    playSound(p => p ? 523 : 440, 80);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-200 via-rose-200 to-amber-200 p-2 sm:p-3 flex flex-col md:flex-row items-center md:items-start justify-center gap-3 md:gap-4 font-rounded-md selection:bg-pink-300 selection:text-pink-800 overflow-x-hidden antialiased">
      {/* Game Column */} 
      <div className="w-full md:flex-1 md:max-w-2xl lg:max-w-3xl xl:max-w-4xl flex flex-col items-center"> 
        {/* Main Game Card */}
        <div className="bg-white/80 backdrop-blur-md p-3 sm:p-4 rounded-[28px] shadow-2xl hover:shadow-purple-300/50 transition-shadow duration-700 ease-in-out animate-pulse-shadow-happy w-full relative overflow-hidden flex flex-col items-center max-w-2xl">
            
            {/* Header */}
            <div className="text-center mb-3 sm:mb-4 w-full">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 filter drop-shadow-md py-1">
                    Snacke Time!
                </h1>
                <div className="flex justify-center items-center gap-3 sm:gap-4 mt-1 sm:mt-2">
                    <div className="text-md sm:text-lg py-1.5 px-3 sm:py-2 sm:px-4 bg-yellow-300 rounded-xl shadow-lg text-yellow-800 font-semibold flex items-center gap-1.5"><Heart size={18} className="fill-red-500 text-red-500"/> Score: <span className="font-bold text-xl">{score}</span></div>
                    <div className="text-md sm:text-lg py-1.5 px-3 sm:py-2 sm:px-4 bg-purple-300 rounded-xl shadow-lg text-purple-800 font-semibold flex items-center gap-1.5"><Star size={18} className="fill-yellow-500 text-yellow-500"/> High: <span className="font-bold text-xl">{highScore}</span></div>
                </div>
            </div>

            {/* Status Indicators */} 
            <div className="flex flex-wrap justify-center items-center gap-2 mb-2 sm:mb-3 h-auto min-h-[36px] sm:min-h-[40px]">
                {hasShield && (
                    <div className={`flex items-center gap-1.5 ${POWER_UPS.SHIELD.color} ${POWER_UPS.SHIELD.textColor} px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold animate-bounce shadow-md border-2 border-white/70`}>
                        {POWER_UPS.SHIELD.icon} {POWER_UPS.SHIELD.description}
                    </div>
                )}
                {gameSpeed < INITIAL_SPEED * 0.95 && POWER_UPS.SPEED && (
                     <div className={`flex items-center gap-1.5 ${POWER_UPS.SPEED.color} ${POWER_UPS.SPEED.textColor} px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold animate-pulse shadow-md border-2 border-white/70`}>
                        {POWER_UPS.SPEED.icon} {POWER_UPS.SPEED.description}
                    </div>
                )}
                {isPaused && !isGameOver && (
                    <div className={`flex items-center gap-1.5 bg-teal-300 text-teal-800 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-md border-2 border-white/70`}>
                        <Pause size={14} /> Game Paused
                    </div>
                )}
            </div>
 
            {/* Game Board */}
            <div 
                className="grid gap-1 bg-sky-100 border-[5px] sm:border-[6px] border-sky-400 rounded-2xl sm:rounded-[22px] p-3 sm:p-4 shadow-xl w-full max-w-xs mobile-landscape:max-w-[calc(100vh-180px)] sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto relative overflow-hidden"
                style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, index) => {
                const x = index % GRID_COLS;
                const y = Math.floor(index / GRID_COLS);
                const isSnakeHead = snake.length > 0 && snake[0].x === x && snake[0].y === y;
                const isSnakeBody = snake.slice(1).some(segment => segment.x === x && segment.y === y);
                const isFood = food.x === x && food.y === y;

                return (
                    <div
                    key={index}
                    className={`
                        aspect-square rounded-lg sm:rounded-xl transition-colors duration-100 ease-in-out 
                        ${isSnakeHead && !isGameOver ? `${currentSnakeColor.head} animate-ping-once` : ''} 
                        ${isSnakeHead && isGameOver ? `${currentSnakeColor.head}` : ''}
                        ${isSnakeBody ? `${currentSnakeColor.body}` : ''} 
                        ${isFood ? 'flex items-center justify-center' : ''} 
                        ${!isSnakeHead && !isSnakeBody && !isFood ? 'bg-sky-50 hover:bg-sky-200/50' : ''}
                    `}
                    >
                    {isFood && (
                        <span className="text-2xl sm:text-3xl md:text-3xl flex items-center justify-center h-full w-full animate-bounce filter drop-shadow-lg scale-110 hover:scale-125 transition-transform duration-200">
                        {POWER_UPS[food.type].iconEmoji}
                        </span>
                    )}
                    </div>
                );
                })}
                 {/* Game Over Overlay - positioned relative to the grid */}
                {isGameOver && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-[18px] sm:rounded-[20px] z-20 p-2">
                        <div className="text-center text-white bg-slate-700/80 p-4 sm:p-6 rounded-2xl shadow-xl ring-4 ring-red-400/70">
                            <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-red-400 filter drop-shadow-md">Oopsie!</h2>
                            <p className="text-lg sm:text-xl mb-3">Final Score: <span className="text-yellow-300 font-extrabold text-2xl sm:text-3xl">{score}</span></p>
                            <button
                            onClick={resetGame}
                            className="bg-gradient-to-br from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold transition-all duration-200 ease-in-out transform hover:scale-110 shadow-lg text-md sm:text-lg flex items-center gap-2 mx-auto ring-2 ring-white/70 hover:ring-white focus:ring-4 focus:ring-lime-300 outline-none active:scale-95"
                            >
                            <RotateCcw size={22} /> 
                            Play Again!
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex justify-center items-center gap-2 sm:gap-3 mt-3 sm:mt-4 mb-2 sm:mb-3">
                <button onClick={togglePause} className="text-sm sm:text-md bg-gradient-to-br from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 disabled:from-slate-300 disabled:to-slate-400 disabled:text-slate-500 disabled:opacity-60 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold transition-all duration-200 transform hover:scale-105 shadow-md flex items-center gap-1.5 ring-1 ring-black/10 hover:ring-white/50 focus:ring-4 focus:ring-amber-300 outline-none active:scale-95">
                    {isPaused ? <Play size={18} /> : <Pause size={18} />} 
                    {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button onClick={resetGame} className="text-sm sm:text-md bg-gradient-to-br from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 disabled:from-slate-300 disabled:to-slate-400 disabled:text-slate-500 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold transition-all duration-200 transform hover:scale-105 shadow-md flex items-center gap-1.5 ring-1 ring-black/10 hover:ring-white/50 focus:ring-4 focus:ring-rose-300 outline-none active:scale-95">
                    <RotateCcw size={18} /> Reset
                </button>
                <button onClick={() => { setIsMuted(!isMuted); playSound(isMuted ? 600: 300, 50); }} className="text-sm sm:text-md bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white p-2.5 sm:p-3 rounded-xl font-bold transition-all duration-200 transform hover:scale-105 shadow-md flex items-center ring-1 ring-black/10 hover:ring-white/50 focus:ring-4 focus:ring-violet-300 outline-none active:scale-95">
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />} 
                </button>
            </div>

            {/* Virtual D-Pad for Mobile */} 
            <div className="md:hidden w-full max-w-xs sm:max-w-sm mt-1 mb-1">
                 <div className="grid grid-cols-3 gap-2 sm:gap-2.5 max-w-[180px] sm:max-w-[200px] mx-auto">
                    <div/>
                    <button onClick={() => handleDirectionChange('UP')} className="bg-sky-400 hover:bg-sky-500 active:bg-sky-600 text-white p-3 rounded-xl flex items-center justify-center transition-colors aspect-square shadow-lg ring-1 ring-black/20 focus:ring-4 focus:ring-sky-200 outline-none active:scale-90"><ChevronUp className="w-6 h-6 sm:w-7 sm:h-7" /></button>
                    <div/>
                    <button onClick={() => handleDirectionChange('LEFT')} className="bg-sky-400 hover:bg-sky-500 active:bg-sky-600 text-white p-3 rounded-xl flex items-center justify-center transition-colors aspect-square shadow-lg ring-1 ring-black/20 focus:ring-4 focus:ring-sky-200 outline-none active:scale-90"><ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" /></button>
                    <button onClick={togglePause} className="bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-white p-2.5 rounded-full flex items-center justify-center transition-colors h-14 w-14 sm:h-16 sm:w-16 shadow-lg ring-1 ring-black/20 focus:ring-4 focus:ring-amber-200 outline-none active:scale-90">
                        {isPaused ? <Play className="w-5 h-5 sm:w-6 sm:h-6" /> : <Pause className="w-5 h-5 sm:w-6 sm:h-6" />} 
                    </button>
                    <button onClick={() => handleDirectionChange('RIGHT')} className="bg-sky-400 hover:bg-sky-500 active:bg-sky-600 text-white p-3 rounded-xl flex items-center justify-center transition-colors aspect-square shadow-lg ring-1 ring-black/20 focus:ring-4 focus:ring-sky-200 outline-none active:scale-90"><ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" /></button>
                    <div/>
                    <button onClick={() => handleDirectionChange('DOWN')} className="bg-sky-400 hover:bg-sky-500 active:bg-sky-600 text-white p-3 rounded-xl flex items-center justify-center transition-colors aspect-square shadow-lg ring-1 ring-black/20 focus:ring-4 focus:ring-sky-200 outline-none active:scale-90"><ChevronDown className="w-6 h-6 sm:w-7 sm:h-7" /></button>
                    <div/>
                </div>
            </div>

            {/* Instructions */} 
            <div className="text-center text-slate-600 text-[10px] sm:text-xs mt-2 sm:mt-3 p-2 bg-lime-100/60 rounded-lg shadow-inner w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                <p className="mb-0.5 font-medium">Use <b>Arrow Keys</b>, <b>WASD</b>, or <b>Swipe</b> to wiggle!</p>
                <p className="mb-0 text-[9px] sm:text-[11px] leading-tight">
                    {POWER_UPS.PIZZA.iconEmoji}, {POWER_UPS.HAMBURGER.iconEmoji}, {POWER_UPS.CHERRY.iconEmoji}: Yummy Food! • 
                    {POWER_UPS.SPEED.iconEmoji} Fast Zooms • {POWER_UPS.SHIELD.iconEmoji} Safe Shield
                </p>
            </div>
        </div>
      </div>

      {/* Side Panel for Barn Foto Snacke */} 
      {isGameOver && NUM_BARN_FOTOS > 0 && currentRandomImageName && (
        <div className="w-full max-w-xs sm:max-w-sm md:w-72 lg:w-80 xl:w-[360px] bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-300 p-3 sm:p-4 rounded-[28px] shadow-2xl flex flex-col items-center justify-center self-center md:self-start mt-3 md:mt-0 order-first ring-4 ring-white/70 flex-shrink-0 md:h-auto md:min-h-[calc(100vh-120px)] md:max-h-[calc(100vh-100px)] overflow-y-auto">
          <div className="bg-white/90 backdrop-blur-sm p-3 sm:p-4 rounded-2xl shadow-xl w-full transform transition-all sticky top-2 z-10 ring-2 ring-pink-300/80">
            {currentRandomImageName && (
              <img 
                key={currentRandomImageName} 
                src={`/barnfotosnake/${currentRandomImageName}`} 
                alt="Barn Foto Snacke Time!" 
                className="w-full h-auto rounded-xl object-contain max-h-[45vh] sm:max-h-[55vh] md:max-h-[calc(100vh-280px)] shadow-lg border-4 border-white hover:scale-105 transition-transform duration-300 ease-in-out"
                onError={(e) => { 
                  e.target.style.display='none'; 
                  const parent = e.target.parentNode;
                  if (parent) {
                      const errorText = document.createElement('p');
                      errorText.textContent = `Oh no! ${currentRandomImageName} is hiding!`;
                      errorText.className = 'text-red-600 font-semibold text-center p-4 text-lg';
                      if (!parent.querySelector('.error-image-text')) {
                        errorText.classList.add('error-image-text');
                        parent.insertBefore(errorText, e.target);
                      }
                  }
                }}
              />
            )}
            <p className="text-center text-3xl sm:text-4xl md:text-5xl font-extrabold mt-3 sm:mt-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 animate-bounce filter drop-shadow-lg">
                Snacke Time!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SnakeGame; 