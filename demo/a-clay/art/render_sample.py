import bpy, math, json, random
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
O=Path('/workspace/art-style-exploration/clay-plunger-demo'); O.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
s=bpy.context.scene
s.render.engine='CYCLES';s.cycles.samples=24;s.cycles.use_denoising=True
s.render.resolution_x=512;s.render.resolution_y=768;s.render.resolution_percentage=100
s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGBA';s.render.film_transparent=True
s.world.color=(.36,.30,.23)
s.view_settings.view_transform='AgX'
def mat(name,col,rough=.7):
 m=bpy.data.materials.new(name);m.diffuse_color=(*col,1);m.use_nodes=True
 n=m.node_tree.nodes;bs=n.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*col,1);bs.inputs['Roughness'].default_value=rough
 tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=24;tex.inputs['Detail'].default_value=3
 b=n.new('ShaderNodeBump');b.inputs['Strength'].default_value=.13;b.inputs['Distance'].default_value=.035
 m.node_tree.links.new(tex.outputs['Fac'],b.inputs['Height']);m.node_tree.links.new(b.outputs['Normal'],bs.inputs['Normal'])
 return m
red=mat('vermilion sculpted clay',(.48,.058,.029));wood=mat('ochre clay handle',(.48,.245,.075));dark=mat('clay collar',(.34,.037,.02))
def lathe(name,profile,material):
 verts=[];faces=[];N=80
 for k,(r,z) in enumerate(profile):
  for j in range(N):
   a=j*2*math.pi/N;ir=1+.007*math.sin(3*a+k*.32)+.004*math.sin(9*a+k*.43)
   verts.append((r*ir*math.cos(a),r*ir*math.sin(a),z))
 for k in range(len(profile)-1):
  for j in range(N):a=k*N+j;b=k*N+(j+1)%N;faces.append((a,b,b+N,a+N))
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces);mesh.update();ob=bpy.data.objects.new(name,mesh);s.collection.objects.link(ob);ob.data.materials.append(material)
 for f in mesh.polygons:f.use_smooth=True
 sub=ob.modifiers.new('soft handformed','SUBSURF');sub.levels=2;sub.render_levels=2
 return ob
profile=[(0,.13),(.40,.13),(.60,.10),(.68,.035),(.715,.045),(.73,.085),(.71,.145),(.64,.19),(.60,.30),(.55,.43),(.44,.57),(.31,.65),(.22,.70),(.195,.78),(.17,.80),(0,.80)]
cup=lathe('clay cup',profile,red)
handle=lathe('clay handle',[(0,.70),(.11,.70),(.115,.77),(.12,2.95),(.115,3.05),(.08,3.10),(0,3.11)],wood)
collar=lathe('clay collar',[(.11,.70),(.18,.70),(.18,.77),(.15,.82),(.115,.83)],dark)
base={o.name:[v.co.copy() for v in o.data.vertices] for o in [cup,handle,collar]}
def light(name,loc,power,size):
 bpy.ops.object.light_add(type='AREA',location=loc);a=bpy.context.object;a.name=name;a.data.energy=power;a.data.shape='DISK';a.data.size=size;a.rotation_euler=(Vector((0,0,1))-a.location).to_track_quat('-Z','Y').to_euler()
light('fixed upper left warm key',(-3,-4,7),480,4);light('soft fill',(4,-1,4),100,5)
bpy.ops.object.camera_add(location=(4,-7,5));cam=bpy.context.object;target=Vector((0,0,1.5));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=4.2;s.camera=cam
bpy.context.view_layer.update()
anchor=world_to_camera_view(s,cam,Vector((0,0,.04)));anchor_px=[round(anchor.x*512,2),round((1-anchor.y)*768,2)]
frames=[]
values=[0,.18,.45,.75,1,.72,.28,-.08,0]
for i,c in enumerate(values):
 for v,orig in zip(cup.data.vertices,base[cup.name]):v.co=(orig.x*(1+.24*c),orig.y*(1+.24*c),.035+(orig.z-.035)*(1-.45*c))
 dz=-.765*.45*c
 handle.location.z=dz;collar.location.z=dz
 s.render.filepath=str(O/f'plunger_{i:02}.png');bpy.ops.render.render(write_still=True)
 grip=world_to_camera_view(s,cam,Vector((0,0,2.55+dz)))
 frames.append({'file':f'plunger_{i:02}.png','compression':c,'durationMs':[0,40,40,40,45,35,35,45,0][i],'contactAnchorPx':anchor_px,'gripAnchorPx':[round(grip.x*512,2),round((1-grip.y)*768,2)]})
meta={'version':'art-prototype-01','canvasPx':[512,768],'nominalDisplayPx':[128,192],'trim':False,'premultipliedAlpha':False,'light':'fixed upper-left warm key','contactAnchorPx':anchor_px,'frames':frames,'animationNote':'frames 1-4 compression driven by input; 5-8 feedback return; frame 0/8 idle. Timing is provisional, not gameplay judgement.','gripNote':'Shared grip axis; grip coordinate intentionally moves during compression. Free drag uses idle grip; contact phase locks contact anchor, never also locks grip y.','layers':['bathroom back','contact shadow (contact only)','plunger','front rim occluder','feedback and finger'],'limitations':['fixed viewpoint and light','no arbitrary rotation','no claim of phone runtime validation']}
(O/'plunger_manifest.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(O/'clay_plunger_source.blend'))
