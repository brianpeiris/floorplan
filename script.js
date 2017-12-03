/* globals fabric, u, Symbol */
const $ = document.querySelector.bind(document);

class App {
  constructor(){
    this.mode = App.modes.addFloor;
    this.scale = 1;
    this.addAt = {x: 0, y: 0};
    this.ui = this.getUI(['scale', 'length', 'size', 'width', 'height', 'name', 'message', 'plan']);
    this.line = new fabric.Line([50, 100, 200, 150], { stroke: "red", strokeWidth: 3 });
    
    // retrieve height now, since newing a Canvas changes it.
    const height = this.ui.plan.getClientRects()[0].height; 
    this.canvas = new fabric.Canvas("plan").setDimensions({ width: window.innerWidth, height: height });
    
    const wrapper = this.canvas.wrapperEl;
    u(wrapper).handle("dragover", ()=>{});    
    wrapper.addEventListener("drop", this.loadImageFromDrop.bind(this));    
    this.canvas.on("mouse:up", this.handleMouseUp.bind(this));
    u(this.ui.scale).handle('submit', this.setScale.bind(this));
    u(document.body).on('keyup', this.deleteActiveObject.bind(this))
    u(this.ui.size).handle("submit", this.addThing.bind(this));    
  }
  getUI(elementIds){
    return elementIds.map(document.getElementById.bind(document))
      .reduce((ui, el) => { ui[el.id] = el; return ui; }, {});
  }
  loadImage(img){
    if (img.height > window.innerHeight) {
      img.scaleToHeight(window.innerHeight);
    }
    img.setOptions({
      lockUniScaling: true,
      originX: "center",
      left: window.innerWidth / 2,
      selectable: false
    });
    this.canvas.add(img);
    this.ui.message.textContent = 'Click anywhere to draw a scale line.';
    this.mode = App.modes.startScale;
  }
  loadImageFromDrop(e){
    const url = URL.createObjectURL(e.dataTransfer.files[0]);
    new fabric.Image.fromURL(url, this.loadImage.bind(this));
    e.preventDefault();
  }
  handleMouseUp(opt){
    console.log(opt.e)
    if (opt.target !== null && ['rect', 'group', 'text'].includes(opt.target.type)) { return; }
    switch(this.mode) {
      case App.modes.startScale:
        this.canvas.add(this.line);
        this.line.set({ x1: opt.e.layerX, y1: opt.e.layerY, x2: opt.e.layerX, y2: opt.e.layerY });
        this.canvas.requestRenderAll();
        this.canvas.on("mouse:move", opt => {
          this.line.set({ x2: opt.e.layerX, y2: opt.e.layerY }); 
          this.canvas.requestRenderAll();
        });
        this.mode = App.modes.endScale;
        this.ui.message.textContent = 'Click anywhere to end the scale line.';
        break;
      case App.modes.endScale: 
        this.canvas.remove(this.line);
        this.canvas.off("mouse:move");
        this.ui.scale.style.display = 'block';
        this.ui.length.focus();
        this.ui.length.select();
        this.ui.message.textContent = 'Specify the lenght of the scale line.';
        break;
      case App.modes.addThing:
        this.startAdd(opt.e.layerX, opt.e.layerY);
    }
  }
  setScale(){
    this.scale = Math.hypot(this.line.x2 - this.line.x1, this.line.y2 - this.line.y1) / parseFloat(this.ui.length.value);
    this.ui.scale.style.display = 'none';
    this.mode = App.modes.addThing;
    this.ui.message.textContent = 'Click anywhere to add a thing.';
  }
  deleteActiveObject(e){
    if (e.key !== 'Delete') { return; }
    const activeObject = this.canvas.getActiveObject();
    if (activeObject){
      this.canvas.remove(activeObject);
    }
  }
  startAdd(x, y){  
    this.ui.size.style.display = "block";
    this.ui.width.focus();
    this.ui.width.select();
    this.addAt.x = x;
    this.addAt.y = y;
    this.ui.message.textContent = 'Specify the width, depth and name.';
  }
  addThing(){
    const width = parseFloat(this.ui.width.value) * this.scale;
    const height = parseFloat(this.ui.height.value) * this.scale;
    const group = new fabric.Group([], {
      lockScalingX: true,
      lockScalingY: true,
    });
    group.addWithUpdate(
      new fabric.Rect({
        top: this.addAt.y, left: this.addAt.x,
        originX: 'center', originY: 'center',
        width, height,
        fill: "lightblue",
        opacity: 0.8
      })
    );
    group.setControlsVisibility({
      bl: false, br: false, mb: false, ml: false, mr: false, mt: false, tl: false, tr: false, mtr: true 
    });
    const text = new fabric.Text(
      this.ui.name.value + '\n' + this.ui.width.value + 'x' + this.ui.height.value, 
      {textAlign: 'center', originX: 'center', originY: 'center'})
    if (width >= height){
      text.scaleToHeight(height * 0.8);
    }
    else {
      text.scaleToWidth(width * 0.8)
    }
    group.add(text);
    this.canvas.add(group);
    this.ui.size.style.display = 'none';
    this.ui.message.textContent = 'Click anywhere to add a thing.';
  }
}
App.modes =  {
  addFloor: Symbol(),
  startScale: Symbol(),
  endScale: Symbol(),
  addThing: Symbol(),
};
const app = new App();