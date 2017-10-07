###Install Dependent Library
```bash
sudo apt-get install python-distutils-extra tesseract-ocr tesseract-ocr-eng libopencv-dev libtesseract-dev libleptonica-dev python-all-dev swig libcv-dev python-opencv python-numpy python-setuptools build-essential subversion
sudo apt-get install autoconf automake libtool
sudo apt-get install libpng12-dev libjpeg62-dev libtiff5-dev zlib1g-dev
```

#Install OCR Libary
```bash
wget http://www.leptonica.com/source/leptonica-1.74.4.tar.gz
tar xvf leptonica-1.74.4.tar.gz
cd leptonica-1.74.4
./configure
make
sudo make install
sudo apt-get install tesseract-ocr imagemagick python-tk
sudo easy_install pip; pip install PassportEye
```

