

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1000
canvas.height = 600


class Sprite{
  constructor({position = { x: 0, y:0}, style = {color:'red'}, size={x:30, y:30}}){
    this.position = position
    this.style = style

    this.draw = function () {
      ctx.fillStyle = this.style.color
      ctx.fillRect(position.x, position.y, size.x, size.y)
    }

    this.update = function(){
      this.draw()
    }
  }

}

const iron = new Sprite({style: {color: 'blue'}})

const mousePossition = (e) => {''}

function animate(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  iron.update()  

  requestAnimationFrame(animate)
}

animate()
