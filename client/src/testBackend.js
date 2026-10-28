
async function testBackend() {
  try {
    const response = await fetch("http://localhost:5000/api/test");
    const data = await response.json();

    console.log(data.message);
  } catch (error) {
    console.error("Backend connection failed:", error);
  }
}

testBackend();
