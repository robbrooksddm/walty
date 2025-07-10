import { useEffect, useRef, useState } from 'react'

export function useSpringNumber(target: number, stiffness=0.2, damping=0.5) {
  const [val, setVal] = useState(target)
  const valRef = useRef(val)
  const velRef = useRef(0)
  useEffect(() => {
    let frame: number
    const step = () => {
      const diff = target - valRef.current
      const acc = diff * stiffness
      velRef.current = (velRef.current + acc) * (1 - damping)
      valRef.current += velRef.current
      setVal(valRef.current)
      if (Math.abs(velRef.current) > 0.001 || Math.abs(diff) > 0.001) {
        frame = requestAnimationFrame(step)
      } else {
        setVal(target)
        valRef.current = target
      }
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, stiffness, damping])
  return val
}
