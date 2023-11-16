var wrapper = document.getElementsByClassName('library-container04');

function force_scroll_sideways(element) {
  element.addEventListener("wheel", (event) => {
    event.preventDefault();

    let [x, y] = [event.deltaX, event.deltaY];
    let magnitude;

    if (x === 0) {
      magnitude = y > 0 ? -30 : 30;
    } else {
      magnitude = x;
    }
    element.scrollBy({
      left: magnitude
    });
  });
}

for (let i = 0; i < wrapper.length; i++){
  force_scroll_sideways(wrapper[i])
}

