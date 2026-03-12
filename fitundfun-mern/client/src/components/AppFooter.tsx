import { Link } from 'react-router-dom';

export default function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="font-semibold">Fit &amp; Fun Familien Lager</p>
            <p className="text-primary-200 text-sm">Skilager in Brigels</p>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <Link
              to="/kontakt"
              className="text-primary-200 hover:text-white transition-colors"
            >
              Kontakt
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-primary-600 text-center text-primary-300 text-sm">
          &copy; {currentYear} Fit &amp; Fun Familien Lager. Alle Rechte vorbehalten.
        </div>
      </div>
    </footer>
  );
}
