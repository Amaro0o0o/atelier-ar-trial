import type {Dimensions} from '../types/product';
import {extraSeatBays,seatWidthMM,sectionalLimits,sectionalStandard} from '../services/sectionalSizing';

export default function SectionalSizing({dimensions,onChange}:{dimensions:Dimensions;onChange:(d:Dimensions)=>void}) {
  const changeWidth = (seats:number) => onChange({...dimensions,width:dimensions.width+seats*seatWidthMM});
  return <section className="sizing-controls" aria-label="Sectional size">
    <h3>Size the sectional</h3>
    <p>{dimensions.width} W × {dimensions.depth} D × {dimensions.height} H mm · {3+extraSeatBays(dimensions.width)} seat bays</p>
    <div className="axis-scale"><strong>X · Sofa width</strong>
      <div className="scale-presets">
        <button type="button" disabled={dimensions.width-seatWidthMM/2<sectionalLimits.width[0]} onClick={()=>changeWidth(-0.5)}>−0.5 seat width</button>
        <button type="button" disabled={dimensions.width+seatWidthMM>sectionalLimits.width[1]} onClick={()=>changeWidth(1)}>+1 seat width</button>
      </div>
      <small>1 seat width = {seatWidthMM} mm · Overall width {sectionalLimits.width[0]}–{sectionalLimits.width[1]} mm</small>
    </div>
    {(['depth','height'] as const).map(axis=>{
      const [min,max]=sectionalLimits[axis];
      const leg=axis==='height';
      const label=leg?'Leg height':'Chaise depth';
      const offset=leg?841:0;
      return <label className="axis-scale" key={axis}>{label} · {dimensions[axis]-offset} mm
        <input type="range" aria-label={label} min={min-offset} max={max-offset} value={dimensions[axis]-offset}
          onChange={e=>onChange({...dimensions,[axis]:Number(e.target.value)+offset})}/>
      </label>;
    })}
    <p className="small muted">Each added module uses the original seat, back, pillow, and two support feet. Half-width adjustments shorten the straight section.</p>
    <button type="button" className="text-link" onClick={()=>onChange({...sectionalStandard})}>Reset to standard size</button>
  </section>;
}
