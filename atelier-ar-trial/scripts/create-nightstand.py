import bpy, math, os
from mathutils import Vector
out=r"C:\Users\USER\Documents\Codex\2026-11-16\files-pasted-by-the-user-project\outputs\atelier\public"
os.makedirs(out+"/models",exist_ok=True)
os.makedirs(out+"/images",exist_ok=True)
scene=bpy.data.scenes.new("Atelier — Nook Nightstand")
bpy.context.window.scene=scene
scene.unit_settings.system='METRIC'
scene.unit_settings.scale_length=1.0
def mat(name,color,metal=0,rough=.45):
 m=bpy.data.materials.new(name);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Metallic'].default_value=metal;bs.inputs['Roughness'].default_value=rough
 return m
wood=mat("Finish_Wood",(.48,.29,.14))
inside=mat("Interior_Wood",(.29,.16,.075))
brass=mat("Hardware_Brushed_Brass",(.53,.37,.14),.8,.28)
feet=mat("Foot_Pads",(.055,.05,.04))
root=bpy.data.objects.new("Nook_Nightstand_500x400x550mm",None);scene.collection.objects.link(root)
root["dimensions_mm"]=[500,400,550];root["asset_version"]="1.0";root["front"]="-Y in Blender; +Z in glTF"
parts=[]
def box(name,loc,dims,material,bevel=.004):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
 o=bpy.context.object;o.name=name;o.dimensions=dims
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 o.data.materials.append(material);o.parent=root
 mod=o.modifiers.new("Softened_edges",'BEVEL');mod.width=bevel;mod.segments=3
 o.modifiers.new("Weighted_normals",'WEIGHTED_NORMAL')
 parts.append(o);return o
# Exact total size: 500 W x 400 D x 550 H mm; panel thickness 18 mm.
box("Top",(0,0,.541),(.5,.4,.018),wood,.006)
box("Left_side",(-.241,0,.341),(.018,.4,.382),wood)
box("Right_side",(.241,0,.341),(.018,.4,.382),wood)
box("Bottom",(0,0,.159),(.464,.4,.018),wood)
box("Rear_panel",(0,.191,.350),(.464,.018,.364),inside,.002)
box("Drawer_support_shelf",(0,0,.351),(.464,.382,.018),wood)
box("Drawer_front",(0,-.193,.443),(.458,.014,.164),wood,.004)
box("Drawer_base",(0,0,.374),(.43,.348,.012),inside,.002)
box("Drawer_left",(-.218,0,.425),(.012,.348,.102),inside,.002)
box("Drawer_right",(.218,0,.425),(.012,.348,.102),inside,.002)
box("Drawer_back",(0,.168,.425),(.43,.012,.102),inside,.002)
# Tapered legs with flat floor contacts. Entire asset rests on z=0.
for x in [-.195,.195]:
 for y in [-.145,.145]:
  bpy.ops.mesh.primitive_cone_add(vertices=24,radius1=.014,radius2=.022,depth=.15,location=(x,y,.075))
  o=bpy.context.object;o.name="Tapered_leg";o.data.materials.append(wood);o.parent=root;parts.append(o)
  bevel=o.modifiers.new("Leg_edge",'BEVEL');bevel.width=.002;bevel.segments=2
  o.modifiers.new("Leg_normals",'WEIGHTED_NORMAL')
# Recessed finger pull keeps the hardware inside the declared depth.
box("Drawer_pull_recess",(0,-.201,.475),(.116,.002,.021),inside,.005)
box("Brass_pull",(0,-.202,.475),(.102,.002,.008),brass,.003)
# Keep exact 400 mm depth including handle by shifting fronts inward.
for o in parts:
 if o.name.startswith("Drawer_pull") or o.name.startswith("Brass_pull"):o.location.y+=.003
bpy.ops.object.select_all(action='DESELECT')
root.select_set(True)
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.context.view_layer.update()
coords=[o.matrix_world@Vector(v) for o in parts for v in o.bound_box]
bounds=[(min(v[i] for v in coords),max(v[i] for v in coords)) for i in range(3)]
bpy.ops.export_scene.gltf(filepath=out+"/models/nook-nightstand.glb",export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_extras=True)
# Presentation rig; deliberately excluded from GLB.
floor=mat("Studio_Floor",(.83,.80,.73),rough=.8)
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.001));bpy.context.object.name="Studio_floor";bpy.context.object.data.materials.append(floor)
world=bpy.data.worlds.new("Nook_Studio");world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.83,.84,.8,1);world.node_tree.nodes['Background'].inputs[1].default_value=.6;scene.world=world
for name,loc,power,size in [('Key',(1,-1,2),220,2),('Fill',(-1,-.3,1),90,1.5),('Rim',(.3,1,1.4),160,1.2)]:
 bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.name=name;light.data.energy=power;light.data.shape='DISK';light.data.size=size;light.rotation_euler=(Vector((0,0,.3))-light.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(.95,-1.25,.95));camera=bpy.context.object;camera.name="Product_camera";camera.data.type='ORTHO';camera.data.ortho_scale=.92;camera.rotation_euler=(Vector((0,0,.28))-camera.location).to_track_quat('-Z','Y').to_euler();scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=32
scene.render.resolution_x=1000;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.filepath=out+"/images/nightstand-natural.png"
bpy.ops.wm.save_as_mainfile(filepath=out+"/models/nook-nightstand.blend")
bpy.ops.render.render(write_still=True)
result={'glb':out+"/models/nook-nightstand.glb",'blend':out+"/models/nook-nightstand.blend",'preview':scene.render.filepath,'bounds_metres':bounds,'mesh_parts':len(parts)}

