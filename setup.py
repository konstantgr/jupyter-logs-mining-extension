import setuptools


setuptools.setup(
    name='jupyter-mining-extension',
    version='0.0.1',
    description='',
    # url='https://github.com/BenedictWilkinsAI/cellfolding',
    license='GNU General Public License v3 (GPLv3)T',
    packages=['mining_extension'],
    install_requires=['jupyter'],
    include_package_data=True,
    classifiers=[
        "Programming Language :: Python :: 3.7",
        "Development Status :: 2 - Pre-Alpha",
        "License :: OSI Approved :: GNU General Public License v3 (GPLv3)",
        "Operating System :: OS Independent",
    ]
)
