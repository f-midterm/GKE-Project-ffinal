import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Hero from '../../components/hero/hero';
import { Link } from 'react-router-dom';

function HomePage() {
  const { isAuthenticated } = useOutletContext();

  return (
    <div>
      <Hero isAuthenticated={isAuthenticated} />
      <div id="explore" className="py-4">
        <div className="mx-auto text-center">
          {/* Features Section */}
          <div className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-gray-900">Why Choose Us?</h3>
                <p className="mt-4 text-lg text-gray-600">Experience the best in apartment living</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      ></path>
                    </svg>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Modern Units</h4>
                  <p className="text-gray-600">Fully furnished apartments with modern amenities and comfortable living spaces.</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      ></path>
                    </svg>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Flexible Terms</h4>
                  <p className="text-gray-600">Choose from 6 months, 1 year, or 2 year lease options with special discounts.</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Easy Process</h4>
                  <p className="text-gray-600">Simple application process with quick admin approval and seamless move-in.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Process Section */}
          <div className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-gray-900">How It Works</h3>
                <p className="mt-4 text-lg text-gray-600">Get your apartment in 3 simple steps</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    1
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Browse & Select</h4>
                  <p className="text-gray-600">Browse available apartments and select your preferred unit and lease duration.</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    2
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Submit Application</h4>
                  <p className="text-gray-600">Fill out your personal information and submit your rental application.</p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    3
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">Get Approved</h4>
                  <p className="text-gray-600">Wait for admin approval and receive your lease agreement to move in.</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-blue-600">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="text-center">
                <h3 className="text-3xl font-bold text-white mb-4">Ready to Find Your New Home?</h3>
                <p className="text-xl text-blue-100 mb-8">Start your apartment search today and move in within days.</p>
                <Link
                  to="/booking"
                  className="bg-white hover:bg-gray-100 text-blue-600 font-semibold px-8 py-3 rounded-lg text-lg transition-colors"
                >
                  Start Booking Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;