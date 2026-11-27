import type {SectionalLayout} from '../services/sectionalSizing';
import {chaiseModuleMM,seatWidthMM,sectionalLimits,sectionalStandard} from '../services/sectionalSizing';
import './sectional-sizing.css';

export default function SectionalSizing({dimensions,onChange}:{dimensions:SectionalLayout;onChange:(d:SectionalLayout)=>void}) {
  const side = dimensions.chaiseSide ?? 'left';
  return <section className="sectional-sizing" aria-label="Sectional layout">
    <header><h3>Sectional layout</h3><button type="button" className="layout-reset" onClick={()=>onChange({...sectionalStandard})}>Reset</button></header>
    <div className="chaise-options" role="group" aria-label="Chaise side when facing the sofa">
      {(['left','right'] as const).map(value=><button key={value} type="button" aria-pressed={side===value} onClick={()=>onChange({...dimensions,chaiseSide:value})}>
        <span aria-hidden="true" className={'layout-icon '+value}/>{value==='left'?'Left chaise':'Right chaise'}
      </button>)}
    </div>
    <p className="layout-hint">Left and right as you face the sofa.</p>
    {(['width','depth'] as const).map(axis=>{
      const width=axis==='width', unit=width?seatWidthMM:chaiseModuleMM;
      const minus=width?0.5:1;
      const adjust=(steps:number)=>onChange({...dimensions,[axis]:dimensions[axis]+steps*unit});
      return <div className="layout-row" key={axis}><div><strong>{width?'X · Sofa width':'Y · Chaise depth'}</strong><small>1 module · {unit} mm</small></div>
        <div className="layout-stepper"><button type="button" aria-label={'Reduce '+axis+' by '+minus+' module'} disabled={dimensions[axis]-minus*unit<sectionalLimits[axis][0]} onClick={()=>adjust(-minus)}>−{minus}</button>
        <output>{dimensions[axis]} mm</output><button type="button" aria-label={'Increase '+axis+' by one module'} disabled={dimensions[axis]+unit>sectionalLimits[axis][1]} onClick={()=>adjust(1)}>+1</button></div>
      </div>;
    })}
    <label className="layout-height"><span>Z · Leg height <b>{dimensions.height-841} mm</b></span>
      <input type="range" aria-label="Leg height" min={sectionalLimits.height[0]-841} max={sectionalLimits.height[1]-841} value={dimensions.height-841} onChange={e=>onChange({...dimensions,height:Number(e.target.value)+841})}/>
    </label>
  </section>;
}
