namespace Dewhaven
{
    /// <summary>Quiet environmental mix; birds are not used as a repeating bed.</summary>
    public sealed class Soundscape
    {
        public string nature,music,water;
        public float natureLevel,musicLevel,waterLevel;
        public static Soundscape Select(string area,string weather,int minute)
        {
            bool inside=ContentRegistry.Find(ContentRegistry.Interiors,area)!=null;
            bool cave=ExplorationService.Complex(area)!=null||area.StartsWith("mine-floor-");
            bool night=minute>=1140||minute<420;
            bool settlement=ContentRegistry.Find(ContentRegistry.Towns,area)!=null;
            return new Soundscape{
                nature=!inside&&!cave&&weather=="rain"?"rain":"wind",
                natureLevel=inside?.025f:cave?.045f:weather=="rain"?.24f:night?.07f:.09f,
                music=cave?"cavern":night?"evening":inside||settlement||area=="farm"||area=="lake"?"daylight":"trail",
                musicLevel=inside?.48f:cave?.52f:weather=="rain"?.52f:.65f,
                water=cave?"cavern-water":"river",
                waterLevel=inside?0:cave?.065f:area=="lake"||area=="aster-quay"?.12f:area=="reedwater-marsh"?.10f:area=="saltwind-cliffs"?.08f:area=="briar-hollow"?.05f:0
            };
        }
    }
}
