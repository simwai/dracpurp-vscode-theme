using System;
using System.Collections.Generic;

namespace NightCity.Edgerunners
{
    /// <summary>
    /// Represents a merc in the Night City chrome-manifold.
    /// </summary>
    public class Edgerunner
    {
        public string Handle { get; }
        public double Humanity { get; private set; }
        public List<string> Cyberware { get; } = new List<string>();

        public Edgerunner(string handle, double initialHumanity)
        {
            Handle = handle;
            Humanity = initialHumanity;
        }

        public void InstallChrome(string part, double humanityCost)
        {
            Cyberware.Add(part);
            Humanity -= humanityCost;

            if (Humanity < 0)
            {
                Console.WriteLine($"{Handle} has crossed the edge into Cyberpsychosis.");
            }
        }

        public async System.Threading.Tasks.Task ActivateSandevistan()
        {
            Console.WriteLine("Everything slows down. The world turns to trails of light.");
            await System.Threading.Tasks.Task.Delay(100);
        }
    }

    class Program
    {
        static void Main(string[] args)
        {
            var david = new Edgerunner("David Martinez", 100.0);
            david.InstallChrome("Sandevistan", 15.5);
            Console.WriteLine($"Merc: {david.Handle}, Chrome count: {david.Cyberware.Count}");
        }
    }
}
