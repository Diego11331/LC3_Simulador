const DEMO=`; Producto y cociente en Q7.8, pila y acceso por byte
        .ORIG x3000
        LEA   R0, MSG
        PUTS
        MOVI  R1, #x80        ; 1,5 = x0180
        MOVH  R1, #1
        MOVI  R2, #x40        ; 2,25 = x0240
        MOVH  R2, #2
        MULQ8 R3, R1, R2      ; 3,375 = x0360
        DIVQ8 R4, R3, R2      ; vuelve a 1,5
        PUSHM #x1E            ; guarda R1 a R4
        MOVI  R1, #0
        MOVI  R2, #0
        POPM  #x1E
        LEA   R5, BUF
        STBL  R3, R5, #0      ; byte bajo
        STBH  R3, R5, #1      ; byte alto
        LDR   R0, R5, #0      ; palabra completa
        CLZ   R1, R0
        MOVI  R0, #x4F
        OUT
        MOVI  R0, #x4B
        OUT
        HALT
MSG     .STRINGZ "Hola LC-3X: "
BUF     .BLKW 1
        .END
`;
const $=id=>document.getElementById(id),hx=(v,n=4)=>v.toString(16).toUpperCase().padStart(n,'0'),esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const cpu=new LC3XCPU();let img=null,auto=false,prev=new Uint16Array(8),curRow=null;
$('src').value=DEMO;
function say(html){$('msg').innerHTML=html}
function assemble(){
  const r=LC3XAssembler.assemble($('src').value);
  if(r.errors.length){img=null;say(r.errors.map(e=>'<div class="e">'+esc(e)+'</div>').join(''));$('lst').innerHTML='';render();return}
  img=r;reset();
  $('lst').innerHTML=r.listing.map(it=>'<div class="row" id="L'+it.addr+'"><span class="a">x'+hx(it.addr)+'</span><span class="w">'+(it.w.slice(0,4).map(w=>hx(w)).join(' ')+(it.w.length>4?'…':''))+'</span><span>'+esc(it.src)+'</span></div>').join('');
  say('<span class="k">Ensamblado correcto: '+r.size+' bytes desde x'+hx(r.origin)+'.</span>');
  $('maddr').value=hx(r.origin);render();
}
function reset(){auto=false;cpu.reset();prev=new Uint16Array(8);if(img){cpu.load(img.origin,img.bytes)}$('bRun').classList.remove('on');$('bRun').textContent='Ejecutar';render()}
function render(){
  $('regs').innerHTML=[...cpu.r].map((v,i)=>'<div class="reg'+(v!==prev[i]?' ch':'')+'"><b>R'+i+(i===6?' pila':i===7?' retorno':'')+'</b><span><span class="h">x'+hx(v)+'</span><small>'+((v<<16)>>16)+'</small></span></div>').join('');
  $('flags').innerHTML=['N','Z','P','C'].map(k=>'<span class="f m'+(cpu[k.toLowerCase()]?' on':'')+'">'+k+'</span>').join('')+'<span class="f pc m">PC x'+hx(cpu.pc)+'</span>';
  $('sCnt').textContent=cpu.count.toLocaleString('es-AR');$('sSize').textContent=cpu.size+' bytes';
  $('sSt').innerHTML=cpu.err?'<span style="color:var(--co)">Error: '+esc(cpu.err)+'</span>':cpu.halted?'Detenida':cpu.waiting?'Esperando entrada':auto?'En ejecución':img?'Lista':'Sin programa';
  const h=Object.entries(cpu.hist).sort((a,b)=>b[1]-a[1]).slice(0,7),mx=h.length?h[0][1]:1;
  $('hist').innerHTML=h.map(([k,v])=>'<div class="hb m"><span>'+k+'</span><i style="width:'+Math.max(4,100*v/mx)+'%"></i><em>'+v+'</em></div>').join('');
  $('con').textContent=cpu.out;
  if(curRow)curRow.classList.remove('cur');curRow=$('L'+cpu.pc);if(curRow){curRow.classList.add('cur');curRow.scrollIntoView({block:'nearest'})}
  mem();prev=Uint16Array.from(cpu.r);
}
function mem(){
  let a=parseInt($('maddr').value,16)||0;a&=0xFFF0;let o='';
  for(let r=0;r<16;r++,a=(a+16)&0xFFFF){
    o+='<span class="ad">x'+hx(a)+'</span>  ';let t='';
    for(let k=0;k<16;k++){const b=cpu.mem[(a+k)&0xFFFF],isPc=((a+k)&0xFFFF)===cpu.pc||((a+k)&0xFFFF)===cpu.pc+1;o+=(isPc?'<span class="pc">'+hx(b,2)+'</span>':hx(b,2))+(k===7?'  ':' ');t+=b>31&&b<127?esc(String.fromCharCode(b)):'.'}
    o+=' <span class="asc">'+t+'</span>\n';
  }
  $('mem').innerHTML=o;
}
function run(){
  auto=true;$('bRun').classList.add('on');$('bRun').textContent='Pausar';
  (function tick(){
    if(!auto)return;
    for(let i=0;i<4000&&!cpu.halted&&!cpu.waiting;i++){cpu.step();if(cpu.count>=5e6){cpu.halted=true;cpu.err='límite de 5.000.000 de pasos; ¿bucle infinito?'}}
    if(cpu.halted||cpu.waiting){if(cpu.halted)auto=false;$('bRun').classList.toggle('on',auto);$('bRun').textContent=auto?'Pausar':'Ejecutar';render();return}
    render();requestAnimationFrame(tick);
  })();
}
$('bAsm').onclick=assemble;
$('bStep').onclick=()=>{if(img){auto=false;cpu.step();render()}};
$('bRun').onclick=()=>{if(!img)return;if(auto){auto=false;$('bRun').classList.remove('on');$('bRun').textContent='Ejecutar';render()}else if(!cpu.halted)run()};
$('bRst').onclick=()=>{reset();$('con').textContent=''};
$('bGo').onclick=mem;$('bPc').onclick=()=>{$('maddr').value=hx(cpu.pc&0xFFF0);mem()};
$('maddr').onkeydown=e=>{if(e.key==='Enter')mem()};
$('inp').onkeydown=e=>{if(e.key==='Enter'){const w=cpu.waiting;cpu.feed(e.target.value);e.target.value='';if(w&&auto)run();else render()}};
assemble();
