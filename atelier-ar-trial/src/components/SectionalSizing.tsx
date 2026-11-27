import type {Dimensions} from '../types/product';
import {extraBayAt,sectionalLimits,sectionalStandard} from '../services/sectionalSizing';

export default function SectionalSizing({dimensions,onChange}:{dimensions:Dimensions;onChange:(d:Dimensions)=>void}) {
  return <section className="sizing-controls" aria-label="Sectional size">
    <h3>Size the sectional</h3>
    <p>{dimensions.width} W × {dimensions.depth} D × {dimensions.height} H mm · {dimensions.width>=extraBayAt?'4 seat bays':'3 seat bays'}</p>
    {(['width','depth','height'] as const).map(axis=>{
      const [min,max]=sectionalLimits[axis];
      const leg=axis==='height';
      const label=leg?'Leg height':axis==='width'?'Overall width':'Chaise depth';
      const offset=leg?841:0;
      return <label className="axis-scale" key={axis}>{label} · {dimensions[axis]-offset} mm
        <input type="range" aria-label={label} min={min-offset} max={max-offset} value={dimensions[axis]-offset}
          onChange={e=>onChange({...dimensions,[axis]:Number(e.target.value)+offset})}/>
      </label>;
    })}
    <p className="small muted">At 3400 mm wide, a fourth seat bay and two support feet are added. Adjust the chaise reach or lift the body on taller legs.</p>
    <button type="button" className="text-link" onClick={()=>onChange({...sectionalStandard})}>Reset to standard size</button>
  </section>;
}
