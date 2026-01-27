import { useState, useEffect } from 'react';
import styles from './MotivationalQuote.module.css';

const QUOTES = [
  { text: "A little progress each day adds up to big results.", author: "Satya Nani" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "Consistency is what transforms average into excellence.", author: "Unknown" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { text: "Dripping water hollows out stone, not through force but through persistence.", author: "Ovid" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Unknown" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "The only way to learn a new language is to make mistakes.", author: "Unknown" },
  { text: "Every expert was once a beginner.", author: "Helen Hayes" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "Learning is not attained by chance, it must be sought for with ardor.", author: "Abigail Adams" },
  { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "What we learn with pleasure we never forget.", author: "Alfred Mercier" },
  { text: "Perseverance is not a long race; it is many short races one after the other.", author: "Walter Elliot" },
];

export function MotivationalQuote() {
  const [quote, setQuote] = useState(() => {
    // Pick a random quote on initial load
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  });

  useEffect(() => {
    // Rotate quote every 30 seconds
    const interval = setInterval(() => {
      setQuote(prev => {
        let next;
        do {
          next = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        } while (next.text === prev.text && QUOTES.length > 1);
        return next;
      });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      <blockquote className={styles.quote}>
        <p className={styles.text}>"{quote.text}"</p>
        <cite className={styles.author}>— {quote.author}</cite>
      </blockquote>
    </div>
  );
}
