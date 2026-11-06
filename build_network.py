import json,math,collections,heapq,zipfile,pathlib
import numpy as np
import rasterio
from rasterio.warp import transform
from pyproj import Transformer
from scipy.ndimage import map_coordinates

root=pathlib.Path('/mnt/data'); out=root/'teetertotter_routing_v01';out.mkdir(exist_ok=True)
features=json.load(open(root/'export.geojson'))['features']
transformer=Transformer.from_crs(4326,5174,always_xy=True)
with rasterio.open(root/'teetertotter_dem_pilot/bulgwang_dem_pilot_10m.tif') as ds:
    dem=ds.read(1); affine=ds.transform; nodata=ds.nodata

def elevation(lon,lat):
    x,y=transformer.transform(lon,lat); col,row=~affine*(x,y)
    if not (0<=col<dem.shape[1]-1 and 0<=row<dem.shape[0]-1): return None
    i,j=int(row),int(col); sub=dem[i:i+2,j:j+2]
    if np.any(sub==nodata) or not np.isfinite(sub).all():return None
    a,b=col-j,row-i
    return float(sub[0,0]*(1-a)*(1-b)+sub[0,1]*a*(1-b)+sub[1,0]*(1-a)*b+sub[1,1]*a*b)

def dist(a,b):
    lon1,lat1=a;lon2,lat2=b
    return math.hypot((lon2-lon1)*88000,(lat2-lat1)*111200)

nodes={};ad=collections.defaultdict(list); edges=[]
for f in features:
    p=f['properties']; highway=p.get('highway','')
    if p.get('foot') in ['no','private'] or p.get('access') in ['no','private']:continue
    coords=f['geometry']['coordinates']
    for u,v in zip(coords,coords[1:]):
        a=tuple(u);b=tuple(v);d=dist(a,b)
        if d<0.005:continue
        nodes[a]=a;nodes[b]=b
        e1=elevation(*a);e2=elevation(*b)
        def build(a,b,z1,z2):
            slope=(z2-z1)/d if z1 is not None and z2 is not None else None
            speed=6*math.exp(-3.5*abs(slope+0.05)) if slope is not None else None
            t=d/1000/speed*60 if speed else None
            # stair segments are excluded from accessible route; Tobler only not adequate
            return {'a':a,'b':b,'distance_m':d,'tobler_min':t,'slope':slope,'highway':highway,'source':p.get('@id'),'has_elevation':slope is not None}
        e=build(a,b,e1,e2);er=build(b,a,e2,e1)
        ad[a].append(e);ad[b].append(er);edges.append(e)

start=(126.9277516,37.6254199); goal=(126.9220428,37.6194408)
def nearest(pos):return sorted(((dist(pos,n),n) for n in nodes),key=lambda x:x[0])[:5]
print('nodes',len(nodes),'edges',len(edges),'dem coverage',sum(e['has_elevation'] for e in edges)/len(edges))
print('start nearest',nearest(start));print('goal nearest',nearest(goal))
# snap to closest coordinate (candidate entrance not verified)
s=nearest(start)[0][1]; t=nearest(goal)[0][1]

def route(cost,stairs_allowed=True):
    q=[(0,s)];best={s:0};prev={}
    while q:
        val,node=heapq.heappop(q)
        if val!=best[node]:continue
        if node==t:break
        for e in ad[node]:
            if e['highway']=='steps' and not stairs_allowed:continue
            c=cost(e)
            if c is None:continue
            nxt=e['b'];new=val+c
            if new<best.get(nxt,float('inf')):
                best[nxt]=new;prev[nxt]=(node,e);heapq.heappush(q,(new,nxt))
    if t not in best:return None
    path=[];cur=t
    while cur!=s:
        pp,e=prev[cur];path.append(e);cur=pp
    path.reverse();return path

short=route(lambda e:e['distance_m'])
# exclude any road segments lacking elevation rather than pretending flat
min_time=route(lambda e:e['tobler_min'] if e['tobler_min'] is not None else None)
for name,path in [('shortest',short),('tobler',min_time)]:
    if path:
        print(name,'segments',len(path),'meters',round(sum(e['distance_m'] for e in path)), 'tobler time',round(sum(e['tobler_min'] for e in path if e['tobler_min'] is not None),2),'missing elevation',sum(not e['has_elevation'] for e in path),'steps',sum(e['highway']=='steps' for e in path))
    else:print(name,'NO ROUTE')

# all paths for display, include metadata as pilot only
fs=[]
for label,path in [('shortest',short),('tobler',min_time)]:
    if not path:continue
    fs.append({'type':'Feature','properties':{'route':label,'distance_m':round(sum(e['distance_m'] for e in path),1),'tobler_minutes_known_sections':round(sum(e['tobler_min'] for e in path if e['tobler_min'] is not None),2),'missing_elevation_segments':sum(e['tobler_min'] is None for e in path),'is_pilot':True,'snapped_start_m':round(dist(start,s),1),'snapped_end_m':round(dist(goal,t),1)},'geometry':{'type':'LineString','coordinates':[list(path[0]['a'])]+[list(e['b']) for e in path]}})
json.dump({'type':'FeatureCollection','features':fs},open(out/'pilot_routes.geojson','w'),ensure_ascii=False)
report={'features_in_source':len(features),'graph_nodes':len(nodes),'graph_undirected_segments':len(edges),'elevation_available_segments':sum(e['has_elevation'] for e in edges),'elevation_missing_segments':sum(not e['has_elevation'] for e in edges),'snap_start_m':dist(start,s),'snap_end_m':dist(goal,t),'routes':[{**x['properties']} for x in fs]}
json.dump(report,open(out/'quality_report.json','w'),indent=2,ensure_ascii=False)
with open(out/'README.md','w') as f:
    f.write('# Teetertotter routing pilot\n\nThese are preliminary routes based on OSM vertex connectivity and an experimental interpolated DEM. They are NOT validated pedestrian directions. Coordinate snap distances are in quality_report.json. Missing elevations are not treated as flat. Tobler model is not elderly-specific. Do not present routes as safe or accessible. Verify intersections, foot access, road geometry, stairs and entrances on site.\n')
with zipfile.ZipFile(root/'teetertotter_routing_v01.zip','w',zipfile.ZIP_DEFLATED) as z:
    for f in out.iterdir(): z.write(f,f.name)
