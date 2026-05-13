import { useState } from "react";

function App() {
  const [user, setUser] = useState(null);

  return (
    <div>
      {!user ? (
        <Login setUser={setUser} />
      ) : (
        <Dashboard user={user} />
      )}
    </div>
  );
}

export default App;