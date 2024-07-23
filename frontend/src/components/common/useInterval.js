import { useEffect, useRef } from 'react';

function useInterval(callback, delay) {
    const savedCallback = useRef();

    // 保存されたコールバックを記憶する
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // インターバルを設定する
    useEffect(() => {
        function tick() {
            savedCallback.current();
        }
        if (delay !== null) {
            let id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
}

export default useInterval;
