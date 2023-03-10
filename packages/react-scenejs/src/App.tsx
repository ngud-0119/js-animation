import { useEffect } from 'react';
import './App.css';
import { useScene } from './react-scenejs/useScene';
import { selectorAll } from 'scenejs';


export default function App() {
  const scene = useScene(
    {
      ".raindrop": selectorAll(
        (i) => ({
          0: { "border-width": "150px", opacity: 1, transform: "scale(0)" },
          1.5: { "border-width": "0px", opacity: 0.3, transform: "scale(0.7)" },
          options: { delay: i * 0.4 }
        }),
        3
      )
    },
    {
      selector: true,
      easing: "ease-in-out",
      iterationCount: "infinite"
    }
  );

  useEffect(() => {
    scene.play();

    return () => {
      scene.finish();
    };
  }, []);

  return (
    <div className="App">
      <div className="raindrop raindrop1"></div>
      <div className="raindrop raindrop2"></div>
      <div className="raindrop raindrop3"></div>
    </div>
  );
}
