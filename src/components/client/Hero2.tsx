import "./Hero2.css"

export default function Hero2() {
  return (
    <div className="hero__wrapper">
      <div className="imageWrapper">
        <div className="headline">
          <span id="letter_l">L</span>
          <span id="letter_e">E</span>
          <span id="letter_v">V</span>
          <span id="letter_e2">E</span>
          <span id="letter_l2">L</span>
          <span style={{visibility: "hidden"}} >-</span>
          <span style={{zIndex: "-2"}}>U</span>
          <span id="letter_p">P</span>


        </div>
        <div className="hendoImageDiv"></div>
      </div>
    </div>
  )
}
