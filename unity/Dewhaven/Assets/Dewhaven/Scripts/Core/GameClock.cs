using System;
using System.Collections.Generic;
namespace Dewhaven
{
    public sealed class GameClock
    {
        private readonly GameState state;
        private readonly HashSet<long> pauses=new HashSet<long>();
        private long nextId;
        private double remainder;
        public int MinuteOfDay => state.minute;
        public bool IsPaused => pauses.Count>0;
        public event Action<int> MinuteChanged;
        public GameClock(GameState state=null) { this.state=state??new GameState(); }
        public IDisposable Pause(string owner)
        {
            long id=++nextId;pauses.Add(id);return new PauseOwner(()=>pauses.Remove(id));
        }
        public void Advance(float elapsedSeconds)
        {
            if(IsPaused || float.IsNaN(elapsedSeconds) || float.IsInfinity(elapsedSeconds) || elapsedSeconds<=0) return;
            remainder+=elapsedSeconds;
            while(remainder>=1 && state.minute<1560) { remainder-=1;state.minute++;MinuteChanged?.Invoke(state.minute); }
        }
        public void ResetRemainder() { remainder=0; }
        private sealed class PauseOwner : IDisposable
        {
            private Action release;
            public PauseOwner(Action release) { this.release=release; }
            public void Dispose() { var action=release;release=null;action?.Invoke(); }
        }
    }
}
